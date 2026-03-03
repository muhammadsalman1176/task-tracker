import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all tasks, optionally filtered by date
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    const tasks = date
      ? await db.task.findMany({
          where: { date },
          orderBy: { createdAt: 'desc' },
        })
      : await db.task.findMany({
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        });

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    // Return empty tasks array instead of error to prevent client-side loops
    return NextResponse.json({ tasks: [] }, { status: 200 });
  }
}

// POST create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, date, category } = body;

    if (!description || !date || !category) {
      return NextResponse.json(
        { error: 'Description, date, and category are required' },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        description,
        date,
        category,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
