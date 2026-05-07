export interface Vendor {
  vendor_id: string;
  vendor_name_kr: string;
  vendor_name_en: string;
  country: string | null;
  homepage: string | null;
  contact_person: string | null;
  email: string | null;
  distributor: string | null;
  status: string | null;
  note: string | null;
}

export interface Product {
  product_id: string;
  vendor_id: string;
  category: string;
  applied_panel: string | null;
  product_name: string;
  cat_no: string | null;
  package_qty: number | null;
  unit: string | null;
  unit_price_krw: number | null;
  price_per_test_krw: number | null;
  RUO_IVD: string | null;
  current_or_candidate: string | null;
  product_url: string | null;
  note: string | null;
}

export interface ProductSpec {
  spec_id: string;
  product_id: string;
  [key: string]: string | number | null;
}

export interface Comparison {
  comparison_id: string;
  category: string;
  applied_panel: string | null;
  current_product_id: string;
  alternative_product_id: string;
  purpose: string | null;
  period: string | null;
  tester: string | null;
  result_status: string | null;
  result_summary: string | null;
  conclusion: string | null;
  next_action: string | null;
  created_date: number | null;
  updated_date: number | null;
}

export interface ExperimentResult {
  experiment_id: string;
  comparison_id: string;
  metric_group: string | null;
  metric_name: string | null;
  current_value: number | string | null;
  alternative_value: number | string | null;
  unit: string | null;
  criterion: string | null;
  judgement: string | null;
  comment: string | null;
}

export interface Attachment {
  attachment_id: string;
  linked_type: string;
  linked_id: string;
  file_name: string;
  file_type: string | null;
  file_path_or_url: string | null;
  description: string | null;
  uploaded_by: string | null;
  uploaded_date: number | null;
  note: string | null;
}

export interface MaterialsData {
  vendor: Vendor[];
  product: Product[];
  spec: ProductSpec[];
  comparison: Comparison[];
  experiment: ExperimentResult[];
  attachment: Attachment[];
  categories: { category: string; value: string; description: string | null }[];
}
