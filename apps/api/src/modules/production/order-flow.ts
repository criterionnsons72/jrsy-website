/**
 * Order / production state machine. Pure and data-only so transitions are
 * trivially testable and can't drift from the documented workflow:
 *
 *   Draft → Measurement Review → Customer Approval → Payment Complete →
 *   Measurement Locked → Pattern Preparation → Fabric Allocation → Cutting →
 *   Stitching → Quality Control → Packing → Dispatch → Delivered
 */

export type OrderStatus =
  | 'draft'
  | 'measurement_review'
  | 'customer_approval'
  | 'payment_complete'
  | 'measurement_locked'
  | 'pattern_preparation'
  | 'fabric_allocation'
  | 'cutting'
  | 'stitching'
  | 'quality_control'
  | 'packing'
  | 'dispatch'
  | 'delivered'
  | 'cancelled';

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  draft: ['measurement_review', 'cancelled'],
  measurement_review: ['customer_approval', 'cancelled'],
  customer_approval: ['payment_complete', 'cancelled'],
  payment_complete: ['measurement_locked', 'cancelled'],
  measurement_locked: ['pattern_preparation', 'cancelled'],
  pattern_preparation: ['fabric_allocation', 'cancelled'],
  fabric_allocation: ['cutting', 'cancelled'],
  cutting: ['stitching', 'cancelled'],
  stitching: ['quality_control', 'cancelled'],
  // QC can pass forward to packing, or fail back to stitching for a remake.
  quality_control: ['packing', 'stitching', 'cancelled'],
  packing: ['dispatch', 'cancelled'],
  dispatch: ['delivered'],
  delivered: [],
  cancelled: [],
};

/** Stages from here on happen inside the workshop. */
export const PRODUCTION_STAGES: OrderStatus[] = [
  'pattern_preparation',
  'fabric_allocation',
  'cutting',
  'stitching',
  'quality_control',
  'packing',
  'dispatch',
];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT[from]?.includes(to) ?? false;
}

export function allowedNext(from: OrderStatus): OrderStatus[] {
  return NEXT[from] ?? [];
}

export function isProductionStage(status: OrderStatus): boolean {
  return PRODUCTION_STAGES.includes(status);
}

/** The stage at which the workshop takes over (a ProductionTask is created). */
export const PRODUCTION_ENTRY: OrderStatus = 'pattern_preparation';
