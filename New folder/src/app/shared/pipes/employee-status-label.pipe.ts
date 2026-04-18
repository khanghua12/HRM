import { Pipe, PipeTransform } from '@angular/core';
import type { Employee } from '../../models/employee.model';
import { employeeStatusVi } from '../utils/employee-labels';

@Pipe({
  name: 'employeeStatusLabel',
  standalone: true
})
export class EmployeeStatusLabelPipe implements PipeTransform {
  transform(value: Employee['status']): string {
    return employeeStatusVi(value);
  }
}
