import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/contacts - List contacts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const listId = searchParams.get("listId");
    const search = searchParams.get("search");

    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (listId) {
      where.lists = { some: { listId } };
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lists: {
            include: { list: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

// POST /api/contacts - Create contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, phone, company, customFields, listIds, source } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if contact exists
    const existing = await prisma.contact.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Contact already exists", contact: existing }, { status: 409 });
    }

    const contact = await prisma.contact.create({
      data: {
        email: email.toLowerCase().trim(),
        firstName,
        lastName,
        phone,
        company,
        customFields: customFields || {},
        source,
        lists: listIds?.length
          ? {
              create: listIds.map((listId: string) => ({ listId })),
            }
          : undefined,
      },
      include: {
        lists: { include: { list: true } },
      },
    });

    // Update list member counts
    if (listIds?.length) {
      for (const listId of listIds) {
        await prisma.contactList.update({
          where: { id: listId },
          data: { memberCount: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}

// POST /api/contacts/import - Bulk import contacts
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { contacts, listId, skipDuplicates = true } = body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ error: "Contacts array is required" }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const contactData of contacts) {
      if (!contactData.email) {
        errors.push(`Missing email for contact`);
        continue;
      }

      try {
        const email = contactData.email.toLowerCase().trim();
        const existing = await prisma.contact.findUnique({ where: { email } });

        if (existing) {
          if (skipDuplicates) {
            skipped++;
            // Add to list if not already
            if (listId) {
              await prisma.contactListMember.upsert({
                where: { contactId_listId: { contactId: existing.id, listId } },
                create: { contactId: existing.id, listId },
                update: {},
              });
            }
            continue;
          }
        }

        const contact = await prisma.contact.upsert({
          where: { email },
          create: {
            email,
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            phone: contactData.phone,
            company: contactData.company,
            customFields: contactData.customFields || {},
            source: "import",
          },
          update: {
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            phone: contactData.phone,
            company: contactData.company,
          },
        });

        if (listId) {
          await prisma.contactListMember.upsert({
            where: { contactId_listId: { contactId: contact.id, listId } },
            create: { contactId: contact.id, listId },
            update: {},
          });
        }

        imported++;
      } catch (e) {
        errors.push(`Error importing ${contactData.email}: ${e}`);
      }
    }

    // Update list member count
    if (listId) {
      const count = await prisma.contactListMember.count({ where: { listId } });
      await prisma.contactList.update({
        where: { id: listId },
        data: { memberCount: count },
      });
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 10), // Return first 10 errors
      totalErrors: errors.length,
    });
  } catch (error) {
    console.error("Error importing contacts:", error);
    return NextResponse.json({ error: "Failed to import contacts" }, { status: 500 });
  }
}
