import axios from 'axios'
import { Toast } from '@coreui/coreui'

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3500').replace(/\/+$/, '')

// ── Toast helper ──────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const el = document.createElement('div')
  el.className = `toast align-items-center text-white bg-${type} border-0`
  Object.assign(el.style, { position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 })
  el.setAttribute('role', 'alert')
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-coreui-dismiss="toast"></button></div>`
  document.body.appendChild(el)
  const t = new Toast(el, { delay: 3000 })
  t.show()
  el.addEventListener('hidden.coreui.toast', () => el.remove())
}

// ── Axios instance ────────────────────────────────────────────────────
const client = axios.create({ baseURL: `${BASE_URL}/api` })

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  if (!cfg.headers['Content-Type']) cfg.headers['Content-Type'] = 'application/json'
  return cfg
})

client.interceptors.response.use(
  (res) => {
    if (res.config.method !== 'get') showToast(res.data?.message || 'Амжилттай', 'success')
    return res.data
  },
  (err) => {
    if (!err.response) {
      showToast('Сүлжээний алдаа', 'danger')
    } else {
      const { status, data } = err.response
      if (status === 401) {
        showToast('Нэвтрэх шаардлагатай', 'warning')
        localStorage.clear()
        window.location.href = '/#/login'
      } else {
        showToast(data?.message || 'Алдаа гарлаа', 'danger')
      }
    }
    return Promise.reject(err)
  }
)

const api = {
  // ── Auth ──────────────────────────────────────────────────────────
  login:          (data)   => client.post('/auth/login', data),
  me:             ()       => client.get('/auth/me'),
  changePassword: (data)   => client.put('/auth/change-password', data),
  getUsers:       ()       => client.get('/auth/users'),
  createUser:     (data)   => client.post('/auth/users', data),
  toggleUser:     (id)     => client.patch(`/auth/users/${id}/toggle`),

  // ── Companies ─────────────────────────────────────────────────────
  getSubscription:    ()     => client.get('/companies/my/subscription'),
  getBilling:         ()     => client.get('/companies/my/billing'),
  getInvoices:        ()     => client.get('/companies/my/invoices'),
  getPlans:           ()     => client.get('/companies/plans'),
  updateCompany:      (id, data) => client.put(`/companies/${id}`, data),

  // ── Departments ───────────────────────────────────────────────────
  getDepartments:     ()          => client.get('/departments'),
  createDepartment:   (data)      => client.post('/departments', data),
  updateDepartment:   (id, data)  => client.put(`/departments/${id}`, data),
  deleteDepartment:   (id)        => client.delete(`/departments/${id}`),

  // ── Employees ─────────────────────────────────────────────────────
  getEmployees:       (params)    => client.get('/employees', { params }),
  getEmployee:        (id)        => client.get(`/employees/${id}`),
  createEmployee:     (data)      => client.post('/employees', data),
  updateEmployee:     (id, data)  => client.put(`/employees/${id}`, data),
  terminateEmployee:  (id, data)  => client.post(`/employees/${id}/terminate`, data),

  // ── Attendance ────────────────────────────────────────────────────
  getAttendance:      (params)    => client.get('/attendance', { params }),
  getTodayAttendance: ()          => client.get('/attendance/today'),
  getAttendanceSummary:(params)   => client.get('/attendance/summary', { params }),
  checkIn:            (data)      => client.post('/attendance/check-in', data),
  checkOut:           (id, data)  => client.put(`/attendance/${id}/check-out`, data),
  updateAttendance:   (id, data)  => client.put(`/attendance/${id}`, data),

  // ── Work Schedules ────────────────────────────────────────────────
  getSchedules:       (params)    => client.get('/schedules', { params }),
  createSchedule:     (data)      => client.post('/schedules', data),
  bulkCreateSchedule: (data)      => client.post('/schedules/bulk', data),
  updateSchedule:     (id, data)  => client.put(`/schedules/${id}`, data),
  deleteSchedule:     (id)        => client.delete(`/schedules/${id}`),

  // ── Payroll ───────────────────────────────────────────────────────
  getPayrollPeriods:  ()          => client.get('/payroll'),
  createPayrollPeriod:(data)      => client.post('/payroll', data),
  approvePeriod:      (id)        => client.post(`/payroll/${id}/approve`),
  getPeriodSummary:   (id)        => client.get(`/payroll/${id}/summary`),
  getPeriodEntries:   (id)        => client.get(`/payroll/${id}/entries`),
  upsertEntry:        (id, data)  => client.post(`/payroll/${id}/entries`, data),
  bulkUpsertEntries:  (id, data)  => client.post(`/payroll/${id}/entries/bulk`, data),
  generatePayroll:    (id)        => client.post(`/payroll/${id}/generate`),

  // ── RFID ─────────────────────────────────────────────────────────
  getRfidReaders:     ()          => client.get('/rfid/readers'),
  createRfidReader:   (data)      => client.post('/rfid/readers', data),
  updateRfidReader:   (id, data)  => client.put(`/rfid/readers/${id}`, data),
  getRfidCards:       (params)    => client.get('/rfid/cards', { params }),
  createRfidCard:     (data)      => client.post('/rfid/cards', data),
  toggleRfidCard:     (id)        => client.patch(`/rfid/cards/${id}/toggle`),
  getRfidScans:       (params)    => client.get('/rfid/scans', { params }),
  getRfidScanStats:   (params)    => client.get('/rfid/scans/stats', { params }),

  // ── PPE ───────────────────────────────────────────────────────────
  getPpeCategories:   ()          => client.get('/ppe/categories'),
  createPpeCategory:  (data)      => client.post('/ppe/categories', data),
  updatePpeCategory:  (id, data)  => client.put(`/ppe/categories/${id}`, data),
  deletePpeCategory:  (id)        => client.delete(`/ppe/categories/${id}`),
  getPpeItems:        (params)    => client.get('/ppe/items', { params }),
  createPpeItem:      (data)      => client.post('/ppe/items', data),
  updatePpeItem:      (id, data)  => client.put(`/ppe/items/${id}`, data),
  getPpeChecks:       (params)    => client.get('/ppe/checks', { params }),
  getPpeCheckStats:   (params)    => client.get('/ppe/checks/stats', { params }),

  // ── Training ──────────────────────────────────────────────────────
  getTrainings:       ()          => client.get('/training'),
  createTraining:     (data)      => client.post('/training', data),
  updateTraining:     (id, data)  => client.put(`/training/${id}`, data),
  deleteTraining:     (id)        => client.delete(`/training/${id}`),
  getTrainingRecords: (params)    => client.get('/training/records', { params }),
  createTrainingRecord:(data)     => client.post('/training/records', data),
  getTrainingStatus:  (params)    => client.get('/training/status', { params }),

  // ── Clothing Orders ───────────────────────────────────────────────
  getClothing:        (params)    => client.get('/clothing', { params }),
  createClothing:     (data)      => client.post('/clothing', data),
  updateClothing:     (id, data)  => client.put(`/clothing/${id}`, data),
  approveClothing:    (id)        => client.post(`/clothing/${id}/approve`),
  rejectClothing:     (id)        => client.post(`/clothing/${id}/reject`),
  issueClothing:      (id)        => client.post(`/clothing/${id}/issue`),

  // ── Site Access ───────────────────────────────────────────────────
  getSiteAccess:      ()          => client.get('/site-access'),
  createSiteAccess:   (data)      => client.post('/site-access', data),
  updateSiteAccess:   (id, data)  => client.put(`/site-access/${id}`, data),
  deleteSiteAccess:   (id)        => client.delete(`/site-access/${id}`),
  checkAccess:        (data)      => client.post('/site-access/check', data),

  // ── Dashboard ─────────────────────────────────────────────────────
  getDashboardOverview:       ()        => client.get('/dashboard/overview'),
  getAttendanceTrend:         (params)  => client.get('/dashboard/attendance-trend', { params }),
  getRfidDeniedReasons:       (params)  => client.get('/dashboard/rfid-denied-reasons', { params }),
  getTrainingCompliance:      ()        => client.get('/dashboard/training-compliance'),

  // ── Marketplace (company-side) ────────────────────────────────────
  getMarketCatalog:        (params)     => client.get('/marketplace/items', { params }),
  getMarketCategories:     ()           => client.get('/marketplace/items/categories'),
  getMarketCatalogItem:    (id)         => client.get(`/marketplace/items/${id}`),
  getMarketOrders:         (params)     => client.get('/marketplace/orders', { params }),
  getMarketOrder:          (id)         => client.get(`/marketplace/orders/${id}`),
  createMarketOrder:       (data)       => client.post('/marketplace/orders', data),
  cancelMarketOrder:       (id)         => client.post(`/marketplace/orders/${id}/cancel`),

  // ── Tools & checkouts ────────────────────────────────────────────
  getToolStats:        ()         => client.get('/tools/stats'),
  getTools:            (params)   => client.get('/tools', { params }),
  createTool:          (data)     => client.post('/tools', data),
  updateTool:          (id, data) => client.put(`/tools/${id}`, data),
  deleteTool:          (id)       => client.delete(`/tools/${id}`),
  getCheckouts:        (params)   => client.get('/tools/checkouts', { params }),
  checkoutTool:        (data)     => client.post('/tools/checkouts', data),
  scanCheckoutTool:    (data)     => client.post('/tools/checkouts/scan', data),
  returnTool:          (id, data) => client.post(`/tools/checkouts/${id}/return`, data),

  // ── Violations & penalty fund ────────────────────────────────────
  getViolationStats:   (params)   => client.get('/violations/stats', { params }),
  getViolations:       (params)   => client.get('/violations', { params }),
  createViolation:     (data)     => client.post('/violations', data),
  updateViolation:     (id, data) => client.put(`/violations/${id}`, data),
  deleteViolation:     (id)       => client.delete(`/violations/${id}`),
  getViolationSettings:()         => client.get('/violations/settings'),
  updateViolationSettings:(data)  => client.put('/violations/settings', data),
  getFundBalance:      ()         => client.get('/violations/fund/balance'),
  getFundExpenses:     ()         => client.get('/violations/fund/expenses'),
  createFundExpense:   (data)     => client.post('/violations/fund/expenses', data),
  deleteFundExpense:   (id)       => client.delete(`/violations/fund/expenses/${id}`),

  // ── Training shop (browse catalog + order trainings) ─────────────
  getTrainingCatalog:        (params)     => client.get('/training-shop/catalog', { params }),
  getTrainingCategories:     ()           => client.get('/training-shop/catalog/categories'),
  getTrainingOrders:         (params)     => client.get('/training-shop/orders', { params }),
  getTrainingOrder:          (id)         => client.get(`/training-shop/orders/${id}`),
  createTrainingOrder:       (data)       => client.post('/training-shop/orders', data),
  cancelTrainingOrder:       (id)         => client.post(`/training-shop/orders/${id}/cancel`),
  addTrainingParticipants:   (id, data)   => client.post(`/training-shop/orders/${id}/participants`, data),
  removeTrainingParticipant: (id, pid)    => client.delete(`/training-shop/orders/${id}/participants/${pid}`),
  updateTrainingParticipant: (id, pid, data) => client.put(`/training-shop/orders/${id}/participants/${pid}`, data),
  bulkUpdateParticipants:    (id, data)   => client.post(`/training-shop/orders/${id}/participants/bulk-update`, data),

  // ── Brigades ─────────────────────────────────────────────────────
  getBrigadeStats:     ()         => client.get('/brigades/stats'),
  getBrigades:         (params)   => client.get('/brigades', { params }),
  getBrigade:          (id)       => client.get(`/brigades/${id}`),
  createBrigade:       (data)     => client.post('/brigades', data),
  updateBrigade:       (id, data) => client.put(`/brigades/${id}`, data),
  deleteBrigade:       (id)       => client.delete(`/brigades/${id}`),
  addBrigadeMembers:   (id, data) => client.post(`/brigades/${id}/members`, data),
  removeBrigadeMember: (mid)      => client.delete(`/brigades/members/${mid}`),

  // ── Brigade tasks (assignments) ──────────────────────────────────
  getBrigadeTaskStats: ()         => client.get('/brigades/tasks/stats'),
  getBrigadeTasks:     (params)   => client.get('/brigades/tasks', { params }),
  createBrigadeTask:   (data)     => client.post('/brigades/tasks', data),
  updateBrigadeTask:   (id, data) => client.put(`/brigades/tasks/${id}`, data),
  deleteBrigadeTask:   (id)       => client.delete(`/brigades/tasks/${id}`),

  // ── Brigade contracts ────────────────────────────────────────────
  getBrigadeContracts: (params)   => client.get('/brigades/contracts', { params }),
  getBrigadeContract:  (id)       => client.get(`/brigades/contracts/${id}`),
  createBrigadeContract:(data)    => client.post('/brigades/contracts', data),
  updateBrigadeContract:(id,data) => client.put(`/brigades/contracts/${id}`, data),
  startBrigadeContract:    (id)   => client.post(`/brigades/contracts/${id}/start`),
  completeBrigadeContract: (id)   => client.post(`/brigades/contracts/${id}/complete`),
  cancelBrigadeContract:   (id)   => client.post(`/brigades/contracts/${id}/cancel`),
  recordBrigadePayment:(id, data) => client.post(`/brigades/contracts/${id}/payments`, data),
  deleteBrigadePayment:(pid)      => client.delete(`/brigades/contracts/payments/${pid}`),

  // ── Danger zones (#1) ────────────────────────────────────────────
  getDangerZones:      (params)   => client.get('/safety/danger-zones', { params }),
  getDangerZonesLive:  (params)   => client.get('/safety/danger-zones/live', { params }),
  createDangerZone:    (data)     => client.post('/safety/danger-zones', data),
  updateDangerZone:    (id, data) => client.put(`/safety/danger-zones/${id}`, data),
  deleteDangerZone:    (id)       => client.delete(`/safety/danger-zones/${id}`),

  // ── Morning inspections (#4) ─────────────────────────────────────
  getMorningToday:     ()         => client.get('/safety/morning-inspections/today'),
  getMorningInspections:(params)  => client.get('/safety/morning-inspections', { params }),
  createMorningInspection:(data)  => client.post('/safety/morning-inspections', data),
  deleteMorningInspection:(id)    => client.delete(`/safety/morning-inspections/${id}`),

  // ── Document library (#3, #7) — read only ────────────────────────
  getDocuments:        (params)   => client.get('/safety/documents', { params }),
  getDocWorkTypes:     ()         => client.get('/safety/documents/work-types'),

  // ── Worker clothing (RFID-tagged PPE) ────────────────────────────
  getWorkerClothing:   (params)   => client.get('/worker-clothing', { params }),
  createWorkerClothing:(data)     => client.post('/worker-clothing', data),
  updateWorkerClothing:(id, data) => client.put(`/worker-clothing/${id}`, data),
  deleteWorkerClothing:(id)       => client.delete(`/worker-clothing/${id}`),

  // ── Material estimation (талбайн хэмжээнээс материал бодох) ───────
  getMaterialNorms:    (params)   => client.get('/materials/norms', { params }),
  createMaterialNorm:  (data)     => client.post('/materials/norms', data),
  updateMaterialNorm:  (id, data) => client.put(`/materials/norms/${id}`, data),
  deleteMaterialNorm:  (id)       => client.delete(`/materials/norms/${id}`),
  calculateMaterials:  (data)     => client.post('/materials/calculate', data),
  getMaterialEstimates:()         => client.get('/materials/estimates'),
  getMaterialEstimate: (id)       => client.get(`/materials/estimates/${id}`),
  saveMaterialEstimate:(data)     => client.post('/materials/estimates', data),
  deleteMaterialEstimate:(id)     => client.delete(`/materials/estimates/${id}`),

  // ── KPI ──────────────────────────────────────────────────────────
  getKpiOverview:      (params)   => client.get('/kpi/overview', { params }),
  getKpiTargets:       ()         => client.get('/kpi/targets'),
  updateKpiTarget:     (data)     => client.put('/kpi/targets', data),

  // ── Projects / Objects (ERP backbone) ────────────────────────────
  getProjects:         (params)   => client.get('/projects', { params }),
  getProjectStats:     ()         => client.get('/projects/stats'),
  getProjectLeaderboard: (params) => client.get('/projects/leaderboard', { params }),
  getProject:          (id)       => client.get(`/projects/${id}`),
  getProjectKpi:       (id, params) => client.get(`/projects/${id}/kpi`, { params }),
  createProject:       (data)     => client.post('/projects', data),
  updateProject:       (id, data) => client.put(`/projects/${id}`, data),
  deleteProject:       (id)       => client.delete(`/projects/${id}`),
}

export default api
