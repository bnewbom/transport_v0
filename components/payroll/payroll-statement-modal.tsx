'use client';

import React from 'react';
import { Payroll, PayrollItem, Run } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/data-list';
import { formatDate, formatKRW } from '@/lib/formatters';
import { getRunStatusLabel } from '@/lib/labels';

type Props = {
  payroll: Payroll | null;
  driverName: string;
  driverPhone: string;
  payrollItems: PayrollItem[];
  runs: Run[];
  routeNameById: Record<string, string>;
  onClose: () => void;
};

const isDeductionItem = (item: PayrollItem) => item.itemType === 'DEDUCTION' || item.amount < 0;

const getItemLabel = (type: PayrollItem['itemType']) => ({
  BASIC: '기본급',
  ATTENDANCE_BONUS: '만근수당',
  RUN_ALLOWANCE: '운행수당',
  DEDUCTION: '공제',
}[type] ?? type);

export function PayrollStatementModal({ payroll, driverName, driverPhone, payrollItems, runs, routeNameById, onClose }: Props) {
  if (!payroll) return null;

  const 지급항목 = payrollItems.filter((item) => !isDeductionItem(item));
  const 공제항목 = payrollItems.filter((item) => isDeductionItem(item));
  const 총지급 = 지급항목.reduce((sum, item) => sum + item.amount, 0);
  const 총공제 = Math.abs(공제항목.reduce((sum, item) => sum + item.amount, 0)) || payroll.totalDeductions;
  const 월표기 = payroll.settlementMonth.replace('-', '년 ') + '월';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 cursor-pointer bg-black/50" onClick={onClose} />
      <div className="relative z-10 mx-4 max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg bg-background shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 border-b border-border bg-background px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">급여명세서 ({월표기})</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>인쇄(PDF)</Button>
              <Button variant="outline" onClick={onClose}>닫기</Button>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-6">
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">기사명</p>
              <p className="font-semibold">{driverName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">연락처</p>
              <p className="font-semibold">{driverPhone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">지급일</p>
              <p className="font-semibold">{formatDate(new Date(String(payroll.createdAt)), 'long')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">실수령액</p>
              <p className="font-semibold">{formatKRW(payroll.netAmount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-semibold">지급 내역</h3>
              <div className="space-y-2 text-sm">
                {지급항목.map((item) => (
                  <div key={item.id} className="flex justify-between"><span>{getItemLabel(item.itemType)}</span><span>{formatKRW(item.amount)}</span></div>
                ))}
                {지급항목.length === 0 && <p className="text-muted-foreground">지급 항목이 없습니다.</p>}
                <div className="border-t border-border pt-2 font-semibold flex justify-between"><span>총지급</span><span>{formatKRW(총지급)}</span></div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-semibold">공제 내역</h3>
              <div className="space-y-2 text-sm">
                {공제항목.map((item) => (
                  <div key={item.id} className="flex justify-between"><span>{getItemLabel(item.itemType)}</span><span>{formatKRW(Math.abs(item.amount))}</span></div>
                ))}
                {공제항목.length === 0 && <p className="text-muted-foreground">공제 항목이 없습니다.</p>}
                <div className="border-t border-border pt-2 font-semibold flex justify-between"><span>총공제</span><span>{formatKRW(총공제)}</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">운행 및 기타수당 산출</h3>
              <Badge>{runs.length}건</Badge>
            </div>
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">운행 내역 없음</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="py-2 pr-2">운행일자</th>
                      <th className="py-2 pr-2">노선명</th>
                      <th className="py-2 pr-2">상태</th>
                      <th className="py-2 pr-2">수당</th>
                      <th className="py-2">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <tr key={run.id} className="border-b border-border/60">
                        <td className="py-2 pr-2">{formatDate(new Date(String(run.serviceDate)), 'short')}</td>
                        <td className="py-2 pr-2">{routeNameById[run.routeId] ?? '-'}</td>
                        <td className="py-2 pr-2">{getRunStatusLabel(run.status)}</td>
                        <td className="py-2 pr-2">{formatKRW(run.allowanceAmount)}</td>
                        <td className="py-2">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
