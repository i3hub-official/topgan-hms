import type { PageServerLoad } from './$types';

// Example attendance data structure
interface AttendanceLog {
  id: string | number;
  userName: string;
  role: string;
  checkIn: string;
  checkOut?: string | null;
  hoursWorked?: number;
  location: string;
}

export const load: PageServerLoad = async () => {
  // Fetch your attendance logs from your database or API
  // This is example data - replace with your actual data source
  const attendanceLogs: AttendanceLog[] = [
    {
      id: 1,
      userName: 'John Doe',
      role: 'Security Guard',
      checkIn: new Date().toISOString(),
      checkOut: null,
      hoursWorked: undefined,
      location: 'Main Gate, 123 Security Ave'
    },
    {
      id: 2,
      userName: 'Jane Smith',
      role: 'Supervisor',
      checkIn: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      checkOut: new Date().toISOString(),
      hoursWorked: 8,
      location: 'Office Building, 456 Work St'
    },
    {
      id: 3,
      userName: 'Mike Johnson',
      role: 'Technician',
      checkIn: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      checkOut: null,
      hoursWorked: undefined,
      location: 'Data Center, 789 Tech Rd'
    }
  ];

  return {
    logs: attendanceLogs
  };
};