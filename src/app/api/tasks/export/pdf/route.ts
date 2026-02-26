import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface Task {
  id: string;
  description: string;
  date: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Group tasks by date
function groupTasksByDate(tasks: Task[]) {
  return tasks.reduce((groups, task) => {
    const date = task.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(task);
    return groups;
  }, {} as Record<string, Task[]>);
}

// Split text into lines
function splitText(pdf: any, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  paragraphs.forEach(paragraph => {
    const words = paragraph.split(' ');
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = pdf.getTextWidth(testLine);

      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }
  });

  return lines;
}

// GET export tasks as PDF
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

    // Create PDF document (A4, portrait)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPosition = margin;

    // Add title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Task Tracker', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Add generation date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on ${format(new Date(), 'PPP p')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Group tasks by date
    const groupedTasks = groupTasksByDate(tasks);

    // Sort dates (newest first)
    const sortedDates = Object.keys(groupedTasks).sort((a, b) => b.localeCompare(a));

    // Add tasks grouped by date
    sortedDates.forEach((date, dateIndex) => {
      const dateTasks = groupedTasks[date];

      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
      }

      // Add date header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(format(new Date(date), 'PPP'), margin, yPosition);
      yPosition += 8;

      // Add underline
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Add tasks for this date
      dateTasks.forEach((task, taskIndex) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }

        const taskNum = taskIndex + 1;

        // Clean up description (remove bullet points and extra whitespace)
        const cleanDescription = task.description
          .replace(/•/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        // Add task number
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${taskNum}.`, margin, yPosition);

        // Add task description
        pdf.setFont('helvetica', 'normal');
        const descriptionLines = splitText(pdf, cleanDescription, contentWidth - 10);
        descriptionLines.forEach((line, lineIndex) => {
          if (lineIndex === 0) {
            pdf.text(line, margin + 10, yPosition);
          } else {
            pdf.text(line, margin + 10, yPosition + (lineIndex * 5));
          }
        });
        yPosition += descriptionLines.length * 5 + 4;

        // Add category
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Category: ${task.category}`, margin + 10, yPosition);
        yPosition += 6;
        pdf.setTextColor(0, 0, 0); // Reset to black

        // Add divider line (except for last task)
        if (taskIndex < dateTasks.length - 1) {
          yPosition += 2;
          pdf.setLineWidth(0.2);
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 6;
          pdf.setDrawColor(0, 0, 0); // Reset to black
        }
      });

      // Add spacing between dates
      yPosition += 5;
    });

    // Add footer
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = margin;
    }

    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Total Tasks: ${tasks.length}`, margin, yPosition);

    // Add page numbers
    const pageCount = pdf.internal.pages.length;
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Set response headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="task-tracker-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.pdf"`);
    headers.set('Content-Length', pdfBuffer.length.toString());

    return new NextResponse(pdfBuffer, { headers });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
