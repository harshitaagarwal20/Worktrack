import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import attendanceRoutes from './routes/attendance.routes';
import workReportRoutes from './routes/workReport.routes';
import holidayRoutes from './routes/holiday.routes';
import leaveRoutes from './routes/leave.routes';
import payrollRoutes from './routes/payroll.routes';
import reportRoutes from './routes/report.routes';
import travelReimbursementRoutes from './routes/travelReimbursement.routes';
import outstationClaimRoutes from './routes/outstationClaim.routes';
import { startPayrollAutomation } from './services/payrollAutomation.service';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/work-reports', workReportRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/travel-reimbursements', travelReimbursementRoutes);
app.use('/api/outstation-claims', outstationClaimRoutes);

startPayrollAutomation();

// ─── Serve React frontend ─────────────────────────────────────────────────────
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));
app.get('*', (_req, res, next) => {
  if (_req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicDir, 'index.html'), err => { if (err) next(); });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`WorkTrack API running on http://0.0.0.0:${PORT}`);
});

export default app;
