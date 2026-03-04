# 아키텍처 요약

## 1) 폴더 구조 개요
- `app/*`: Next.js App Router 기반 페이지 라우트이며, 각 도메인 페이지(`clients`, `drivers`, `routes`, `dispatches`, `payroll`, `finance`, `operations`, `reports`, `settings`)가 개별 `page.tsx`로 구성됩니다.
- `components/*`: 공통 UI/레이아웃/CRUD 컴포넌트가 위치합니다. 특히 `components/data-list.tsx`, `components/crud/*`, `components/sidebar.tsx`, `components/layout-shell.tsx`가 페이지 전반의 패턴을 정의합니다.
- `lib/*`: 도메인 타입/스키마(`schemas.ts`, `types.ts`), 포맷터(`formatters.ts`), 목업 데이터 서비스(`data-service.ts`), 로컬스토리지 저장소 레이어(`repository/*`)가 있습니다.

## 2) 데이터 흐름
- 앱은 서버 API 없이 클라이언트 상태 + localStorage 기반 CRUD로 동작합니다.
- 페이지 로드 시 각 페이지가 `repositories.<entity>.getAll()`로 데이터를 읽고, 생성/수정/삭제 후 다시 `load*()`로 목록을 리프레시합니다.
- `BaseRepository`가 CRUD와 `localStorage` 저장을 공통 처리합니다.
- 일부 페이지(`dashboard`, `operations`)는 `dataService` + `initializeMockData()`를 직접 사용하고, 다수 CRUD 페이지는 `repositories`를 사용합니다(혼합 구조).

## 3) 공통 컴포넌트/패턴
- 목록: `DataList<T>` 테이블/모바일 카드 통합 컴포넌트.
- 폼: `ModalForm` + `FormField` + 페이지별 로컬 `validateForm()` 조합.
- 삭제확인: `ConfirmDeleteDialog`.
- 레이아웃: `SidebarLayout`, `Sidebar`, `Header`, `PageContent`, `Grid`, `StatCard`.
- 알림: `useAppToast()` 훅은 존재하지만, 전역 `<Toaster />` 마운트가 확인되지 않아 실제 토스트 노출은 미확인.

## 4) 타입/검증(zod 포함) 현황
- `lib/schemas.ts`에 Zod 스키마가 정의되어 도메인 모델 타이핑 기반은 갖춰져 있습니다.
- 하지만 페이지 폼 검증은 Zod를 직접 쓰지 않고 수동 `validateForm()` 문자열 검증 위주입니다.
- 타입 불일치 징후:
  - Payroll 타입은 `deductions` 필드를 정의했는데 페이지는 `deductionAmount`를 사용.
  - Dispatch 생성 캐스팅에서 존재하지 않는 `changeLogs`를 제외 타입으로 사용.

## 5) Supabase 교체 용이성 평가
- 장점: `BaseRepository` + 엔티티별 repository 분리가 있어 데이터 접근 지점이 1차 추상화돼 있습니다.
- 한계:
  - repository가 브라우저 `localStorage`를 직접 다루므로 infra 계층으로 완전히 분리되지 않았습니다.
  - 일부 화면이 repository 대신 `dataService`를 직접 사용해 패턴이 일관되지 않습니다.
  - 페이지가 도메인 규칙/계산/검증을 직접 보유해 service/usecase 계층 경계가 약합니다.
- 결론: **부분적으로 준비됨(중간 수준)**. Supabase 전환 전 `service/repository interface` 분리와 페이지 의존성 정리가 필요합니다.

# 기능 백로그(상태 포함)

| 기능명 | 경로 | 상태 | 근거 | 비고(의존성/리스크) |
|---|---|---|---|---|
| 로그인 폼 + 로컬 인증 | `app/login/page.tsx` | ✅완료 | 이메일/비밀번호 입력 후 `localStorage.auth` 저장 및 `/dashboard` 이동 구현 | 서버 인증 미구현, 보안/권한 모델 부재 |
| 라우트 가드(페이지별 auth 체크) | `app/*/page.tsx` 다수 | ✅완료 | 각 페이지 `useEffect`에서 auth 없으면 `/login` 리다이렉트 | 공통 가드 미들웨어 부재로 중복 코드 |
| Dashboard KPI/활동 피드 | `app/dashboard/page.tsx` | ✅완료 | `dataService.getDashboardStats()`, `getRecentActivities()` 사용해 카드/리스트 표시 | 목업 데이터 기준이며 실데이터 시 집계 로직 재검증 필요 |
| Clients 목록/검색/상태필터 | `app/clients/page.tsx` | ✅완료 | `searchTerm`, `statusFilter`, `filteredClients` + `DataList` 렌더 | 서버 페이징/정렬 미구현 |
| Clients 생성/수정/삭제 모달 CRUD | `app/clients/page.tsx` | ✅완료 | `ModalForm`, `ConfirmDeleteDialog`, `repositories.clients.create/update/delete` 구현 | 전화/주소 포맷 수준 검증 미흡 |
| Drivers 목록/검색/상태필터 | `app/drivers/page.tsx` | ✅완료 | 검색 + status 필터 + 통계 카드 + `DataList` 구현 | 대량 데이터 성능 최적화 미구현 |
| Drivers 생성/수정/삭제 + 계좌정보 입력 | `app/drivers/page.tsx` | ✅완료 | 드라이버 폼 필드/검증/CRUD 처리 구현 | 라이선스 고유성/형식 검증 미흡 |
| Routes 목록/검색/상태필터 | `app/routes/page.tsx` | ✅완료 | 검색/필터 + 통계 + 리스트 제공 | 정렬 UI는 사실상 없음 |
| Routes 생성/수정/삭제 | `app/routes/page.tsx` | ✅완료 | 거리/시간/기본요금 검증 및 CRUD 구현 | 노선 삭제 시 배차 연관성 검증 없음 |
| Dispatches 목록/검색/상태필터 | `app/dispatches/page.tsx` | ✅완료 | 검색 + status 필터 + 통계 + `DataList` 구현 | routeId/driverId 텍스트 표시(실제 엔티티 조인 없음) |
| Dispatch 생성/수정/삭제 | `app/dispatches/page.tsx` | 🟡부분구현 | CRUD는 있으나 폼에 `clientId` 입력이 없고 스키마 필수 필드와 불일치 | 데이터 무결성(Driver/Route/Client FK) 리스크 큼 |
| Operations 로그 조회 화면 | `app/operations/page.tsx` | 🟡부분구현 | 로그 목록/통계 렌더는 있음 | 필터 select와 `+ New Operation` 버튼에 실제 동작 핸들러 없음 |
| Finance 목록/검색/유형/카테고리 필터 | `app/finance/page.tsx` | ✅완료 | 다중 필터 + 통계 + 리스트 렌더 구현 | 카테고리 enum 확장성은 제한적 |
| Finance 생성/수정/삭제 | `app/finance/page.tsx` | ✅완료 | 타입-카테고리 연동 폼 + CRUD + 삭제확인 구현 | 전표 연동/영수증 파일 등 실무 기능 미구현 |
| Payroll 목록/검색/기간/상태 필터 | `app/payroll/page.tsx` | ✅완료 | 검색/기간/상태 필터 + 리스트 + 통계 구현 | 인사/근태 연동 없음 |
| Payroll 생성/수정/삭제 + 총액 계산 | `app/payroll/page.tsx` | 🟡부분구현 | 모달/CRUD/실시간 총액 계산 구현 | `deductionAmount` vs 스키마 `deductions` 불일치로 타입·무결성 리스크 |
| Reports 화면 | `app/reports/page.tsx` | 🟡부분구현 | 리포트 카드 UI/버튼만 존재 | Generate 버튼 클릭 동작/다운로드/쿼리 미구현 |
| Settings 화면 | `app/settings/page.tsx` | 🟡부분구현 | 설정 입력 UI 및 버튼 존재 | 저장 API/상태 반영/초기화(Danger Zone) 동작 없음 |
| 공통 DataList(데스크톱/모바일) | `components/data-list.tsx` | ✅완료 | 반응형 테이블/카드 전환, empty/loading 표현 제공 | 정렬 아이콘만 있고 실제 정렬 로직 없음 |
| 공통 Modal/삭제확인/FormField 패턴 | `components/crud/*` | ✅완료 | 모달/삭제 다이얼로그/필드 에러표시 재사용화 | 접근성(focus trap/aria) 고도화 필요 |
| Toast UX | `components/crud/toast.tsx`, `app/*` | 🟡부분구현 | 페이지에서 `useAppToast()` 호출 | 전역 `<Toaster />` 미마운트로 실제 표시 미확인 |
| 로컬 저장소 기반 Repository 계층 | `lib/repository/*` | ✅완료 | `BaseRepository` CRUD + localStorage persist 구현 | 동시성/멀티탭 충돌/서버 싱크 전략 미비 |
| Zod 스키마 정의 | `lib/schemas.ts` | ✅완료 | 도메인별 스키마/enum 정의 | 페이지 폼 검증과 단일 소스화 미흡 |
| 도메인 관계 무결성(Driver-Dispatch-Route-Client) | 전반 | ⛔미구현 | 개별 ID 문자열 저장 외 참조 검증/삭제 보호 로직 없음 | 실운영 시 데이터 깨짐 위험 |
| 로딩/에러 상태 표준화 | 전반 | 🟡부분구현 | 일부 로딩 스피너 존재 | 네트워크 오류/예외 상태 UI 일관성 부족 |
| 자동 테스트(유닛/통합/E2E) | 저장소 전반 | ⛔미구현 | 테스트 파일 부재 | 회귀 리스크 높음 |

# 진행현황 보드(칸반)

## Done
- 로그인 + 페이지별 auth 리다이렉트
- Clients / Drivers / Routes / Finance의 모달 기반 CRUD
- Dispatch / Payroll 기본 CRUD 골격
- 공통 DataList/ModalForm/ConfirmDeleteDialog/FormField 구성
- localStorage repository 추상화
- Zod 도메인 스키마 기본 정의

## In Progress
- Dispatch 도메인 정합성 보강(`clientId`, 관계 참조)
- Payroll 필드명/타입 정합성(`deductionAmount` ↔ `deductions`) 정리
- 토스트 시스템 실사용 마무리(Toaster 마운트)
- Operations/Reports/Settings의 버튼 액션 연결

## Next
- Zod 기반 폼 검증 단일화 + 에러 메시지 표준화
- service/usecase 계층 도입(페이지 로직 분리)
- 관계 무결성(참조 체크, 삭제 방지/연쇄 정책)
- 공통 필터/정렬/페이지네이션 컴포넌트
- 테스트 도입(핵심 CRUD/계산 로직)

## Blocked
- Reports 실기능: 백엔드 쿼리/내보내기 스펙 부재로 버튼 UI만 존재
- Settings 저장/초기화: 영속 스토리지/서버 계약 미정
- 상용 인증/권한: 로컬 auth 목업 한계로 RBAC 설계 미착수

# 갭/리스크 체크리스트

- [ ] **UI 일관성**: 페이지별 수동 input/button 스타일과 공용 UI 컴포넌트 사용이 혼재.
- [ ] **접근성**: 모달 focus trap/초기 포커스/aria role 고도화 미흡(커스텀 모달 div 구현).
- [ ] **폼 검증 품질**: 수동 문자열 검증 중심, Zod와 분리되어 규칙 중복·드리프트 위험.
- [ ] **상태 처리**: 로딩은 일부 있으나 에러/빈상태/재시도 UX의 일관된 패턴 부족.
- [ ] **데이터 무결성**: Dispatch·Payroll 필드 불일치, 관계 참조 검증/삭제 정책 없음.
- [ ] **성능**: DataList 클라이언트 전체렌더, 페이징/가상스크롤 없음.
- [ ] **테스트**: 유닛/통합/E2E 테스트 부재.
- [ ] **타입 안정성**: 페이지 단의 강제 캐스팅(`as Omit<...>`, `as any`) 다수.
- [ ] **Mock→Supabase 전환성**: repository는 있으나 service/interface 분리가 불완전, `dataService` 직접 의존 페이지 존재.

# 다음 스프린트 계획

## 우선순위 TOP 10 (가치/리스크/공수 기준)
1. Dispatch 폼에 `clientId` 포함 + 관계 유효성 검증 추가 (공수 M, 역할: 프론트/기획)
2. Payroll 필드명 표준화(`deductions`) 및 마이그레이션 유틸 작성 (공수 M, 역할: 프론트)
3. 전역 `<Toaster />` 마운트 및 토스트 UX 정상화 (공수 S, 역할: 프론트)
4. Operations `New Operation` 생성 플로우 구현 (공수 M, 역할: 프론트/기획)
5. Reports 버튼 실제 액션(필터, 미리보기, CSV 다운로드) MVP 구현 (공수 M, 역할: 프론트/기획)
6. Settings 저장/초기화의 실제 persistence 연결(localStorage 우선) (공수 S, 역할: 프론트)
7. Zod + react-hook-form 기반 공통 폼 스택 도입 (공수 L, 역할: 프론트)
8. 관계 삭제 보호 규칙(참조 중 삭제 금지/경고) 구현 (공수 M, 역할: 프론트/기획)
9. Repository 인터페이스 추상화 + SupabaseRepository 스켈레톤 작성 (공수 M, 역할: 프론트)
10. 핵심 계산/CRUD 회귀 테스트(최소 10케이스) 추가 (공수 M, 역할: 프론트)

## 오늘 당장 할 일 3개
1. `app/layout.tsx`에 `<Toaster />` 연결해 토스트 가시화 (S, 프론트)
2. `app/payroll/page.tsx`의 `deductionAmount`를 스키마와 맞춰 `deductions`로 통일 (S, 프론트)
3. `app/dispatches/page.tsx` 폼에 `clientId` 필드 추가 + 저장 시 필수 검증 (M, 프론트)

## 1주차 목표
- 도메인 정합성 핫픽스: Dispatch/Payroll 타입/필드 정리
- Operations/Settings 기능 연결(버튼 dead-end 제거)
- 토스트/에러표시 표준 UX 적용

## 2주차 목표
- Zod 기반 폼 검증 공통화(2~3개 페이지 선적용)
- repository interface 분리 + Supabase 교체 포인트 설계
- 테스트 기초(계산/CRUD 유닛 테스트)와 릴리스 체크리스트 도입

---

가장 먼저 수정해야 하는 핵심 병목 3개는 **(1) Dispatch/Payroll 데이터 모델 불일치로 인한 무결성 리스크**, **(2) Reports/Settings/Operations의 버튼-동작 단절로 인한 사용자 가치 미달**, **(3) Zod 스키마와 실제 폼 검증 분리로 인한 유지보수/버그 증폭**입니다. 이 3가지를 먼저 해결해야 이후 Supabase 연동과 상용 수준 품질개선이 안정적으로 진행됩니다.
