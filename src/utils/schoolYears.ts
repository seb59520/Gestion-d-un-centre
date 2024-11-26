import { addYears, startOfYear, endOfYear } from 'date-fns';

export interface VacationPeriod {
  name: string;
  start: string;
  end: string;
}

export interface SchoolYearData {
  name: string;
  startDate: Date;
  endDate: Date;
  vacationPeriods: VacationPeriod[];
}

// Function to generate school years for the next 3 years
export function generateSchoolYears(): SchoolYearData[] {
  const currentYear = new Date().getFullYear();
  const schoolYears: SchoolYearData[] = [];

  for (let i = 0; i < 3; i++) {
    const year = currentYear + i;
    const startDate = startOfYear(new Date(year, 8, 1)); // September 1st
    const endDate = endOfYear(new Date(year + 1, 6, 31)); // July 31st

    schoolYears.push({
      name: `${year}-${year + 1}`,
      startDate,
      endDate,
      vacationPeriods: getVacationPeriods(year)
    });
  }

  return schoolYears;
}

// Function to generate vacation periods for a specific year
function getVacationPeriods(year: number): VacationPeriod[] {
  return [
    {
      name: 'Toussaint',
      start: `${year}-10-19`,
      end: `${year}-11-04`
    },
    {
      name: 'Noël',
      start: `${year}-12-21`,
      end: `${year + 1}-01-06`
    },
    {
      name: 'Hiver',
      start: `${year + 1}-02-10`,
      end: `${year + 1}-02-26`
    },
    {
      name: 'Printemps',
      start: `${year + 1}-04-13`,
      end: `${year + 1}-04-29`
    },
    {
      name: 'Été',
      start: `${year + 1}-07-06`,
      end: `${year + 1}-09-02`
    }
  ];
}

// Function to check if a date falls within a vacation period
export function isVacationPeriod(date: Date, vacationPeriods: VacationPeriod[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return vacationPeriods.some(period => 
    dateStr >= period.start && dateStr <= period.end
  );
}

// Function to get the current school year
export function getCurrentSchoolYear(schoolYears: SchoolYearData[]): SchoolYearData | undefined {
  const now = new Date();
  return schoolYears.find(year => 
    now >= year.startDate && now <= year.endDate
  );
}

// Function to format school year for display
export function formatSchoolYear(name: string): string {
  return `School Year ${name}`;
}