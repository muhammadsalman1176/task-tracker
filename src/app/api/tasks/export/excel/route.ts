import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface Task {
  id: string;
  description: string;
  date: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// GET export tasks as Excel
export async function GET(request: NextRequest) {
  try {
    // Fetch all tasks sorted by date (newest first)
    const tasks = await db.task.findMany({
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: 'No tasks to export' },
        { status: 404 }
      );
    }

    // Prepare data for Excel
    const excelData = tasks.map((task, index) => ({
      '#': index + 1,
      Date: format(new Date(task.date), 'MMM dd, yyyy'),
      Category: task.category,
      Description: task.description.replace(/•/g, '').replace(/\n/g, ' ').trim(),
      'Created At': format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm'),
      'Last Updated': format(new Date(task.updatedAt), 'MMM dd, yyyy HH:mm')
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },   // #
      { wch: 15 },  // Date
      { wch: 15 },  // Category
      { wch: 80 },  // Description
      { wch: 20 },  // Created At
      { wch: 20 }   // Last Updated
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

    // Add summary sheet
    const categories = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summaryData = [
      { Metric: 'Total Tasks', Value: tasks.length },
      { Metric: 'Categories', Value: Object.keys(categories).length },
      { Metric: 'Date Range', Value: `${format(new Date(tasks[tasks.length - 1].date), 'MMM dd, yyyy')} - ${format(new Date(tasks[0].date), 'MMM dd, yyyy')}` },
      { Metric: '', Value: '' },
      { Metric: 'Tasks by Category', Value: '' },
      ...Object.entries(categories).map(([category, count]) => ({
        Metric: category,
        Value: count
      }))
    ];

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 25 },  // Metric
      { wch: 15 }   // Value
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename="task-tracker-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.xlsx"`);
    headers.set('Content-Length', buffer.length.toString());

    return new NextResponse(buffer, { headers });
  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel file' },
      { status: 500 }
    );
  }
}
