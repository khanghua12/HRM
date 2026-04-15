import type { EmployeeStatus, EmployeeSummary } from './employee-summary.model';

export interface EmployeeDetail extends Pick<EmployeeSummary, 'id' | 'code' | 'fullName'> {
  department: string | null;
  title: string | null; // Chức danh nghề nghiệp
  position: string | null; // Chức vụ
  positionGroup: string | null; // Nhóm vị trí làm việc
  professionalLevel: string | null; // Cấp bậc chuyên môn
  classification: EmployeeStatus | null; // Phân loại nhân viên
  seniority: string | null; // Thâm niên
  workEmail: string | null;
  timekeepingCode: string | null; // Mã chấm công
  workplace: string | null; // Nơi làm việc
  contractType: string | null; // Loại hợp đồng
  contractNumber: string | null; // Số hợp đồng
  username: string | null; // Tài khoản đăng nhập

  appointedAt: string | null; // Ngày bổ nhiệm
  reappointedAt: string | null; // Ngày bổ nhiệm lại
  joinedOrgAt: string | null; // Ngày vào đơn vị
  traineeStartAt: string | null; // Ngày học việc
  internStartAt: string | null; // Ngày vào thực tập
  internEndAt: string | null; // Ngày kết thúc thực tập
  probationStartAt: string | null; // Ngày thử việc
  probationEndAt: string | null; // Ngày kết thúc thử việc
  officialAt: string | null; // Ngày chính thức
  leaveApprovalAt: string | null; // Ngày xét duyệt phép
  socialInsuranceStartAt: string | null; // Ngày bắt đầu đóng BHXH

  directManagerId: string | null;
  directManagerName: string | null; // Quản lý trực tiếp (lookup)
  hazardousWorkPosition: string | null; // Vị trí công việc độc hại
}

