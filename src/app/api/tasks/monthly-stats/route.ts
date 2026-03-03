import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format } from 'date-fns';

interface Task {
  id: string;
  description: string;
  date: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface MonthlyStats {
  year: number;
  month: number;
  monthName: string;
  totalTasks: number;
  tasksByCategory: Record<string, number>;
  tasksByDay: Record<string, number>;
}

// GET monthly statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // Fetch all tasks sorted by date
    const tasks = await db.task.findMany({
      orderBy: [
        { date: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        allMonths: [],
        selectedMonth: null
      });
    }

    // Group tasks by month
    const monthlyData = new Map<string, MonthlyStats>();

    tasks.forEach(task => {
      const taskDate = new Date(task.date);
      const yearKey = taskDate.getFullYear();
      const monthKey = taskDate.getMonth(); // 0-11
      const key = `${yearKey}-${monthKey}`;

      if (!monthlyData.has(key)) {
        monthlyData.set(key, {
          year: yearKey,
          month: monthKey,
          monthName: format(taskDate, 'MMMM yyyy'),
          totalTasks: 0,
          tasksByCategory: {},
          tasksByDay: {}
        });
      }

      const stats = monthlyData.get(key)!;
      stats.totalTasks++;

      // Count by category
      if (!stats.tasksByCategory[task.category]) {
        stats.tasksByCategory[task.category] = 0;
      }
      stats.tasksByCategory[task.category]++;

      // Count by day
      const dayKey = format(taskDate, 'yyyy-MM-dd');
      if (!stats.tasksByDay[dayKey]) {
        stats.tasksByDay[dayKey] = 0;
      }
      stats.tasksByDay[dayKey]++;
    });

    // Convert map to array and sort by date (newest first)
    const allMonths = Array.from(monthlyData.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    // Find selected month stats
    let selectedMonth: MonthlyStats | null = null;

    if (year && month) {
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      selectedMonth = allMonths.find(
        m => m.year === yearNum && m.month === monthNum
      ) || null;
    } else if (allMonths.length > 0) {
      // Default to most recent month
      selectedMonth = allMonths[0];
    }

    // Calculate overall stats
    const totalTasks = tasks.length;
    const uniqueMonths = monthlyData.size;
    const averageTasksPerMonth = uniqueMonths > 0 ? Math.round(totalTasks / uniqueMonths) : 0;

    // Get category totals across all time
    const categoryTotals = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      allMonths,
      selectedMonth,
      overallStats: {
        totalTasks,
        uniqueMonths,
        averageTasksPerMonth,
        categoryTotals
      }
    });
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly statistics' },
      { status: 500 }
    );
  }
}
