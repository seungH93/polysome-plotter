import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import data from "@/data/materials.json";
import type { MaterialsData, Product } from "@/types/materials";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
} from "recharts";
import { FlaskConical, Package, Building2, ClipboardCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";

const D = data as unknown as MaterialsData;

const TEAL = ["hsl(192 70% 35%)", "hsl(192 60% 50%)", "hsl(170 60% 40%)", "hsl(210 60% 45%)", "hsl(160 50% 45%)", "hsl(200 50% 60%)"];

export default function MaterialsDashboard() {
  const [vendorId, setVendorId] = useState<string>("ALL");
  const [category, setCategory] = useState<string>("ALL");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("name");
  const PAGE_SIZE = 12;

  const vendorMap = useMemo(
    () => Object.fromEntries(D.vendor.map((v) => [v.vendor_id, v])),
    []
  );
  const productMap = useMemo(
    () => Object.fromEntries(D.product.map((p) => [p.product_id, p])),
    []
  );

  const filteredProducts = useMemo<Product[]>(() => {
    return D.product.filter(
      (p) =>
        (vendorId === "ALL" || p.vendor_id === vendorId) &&
        (category === "ALL" || p.category === category)
    );
  }, [vendorId, category]);

  const filteredProductIds = new Set(filteredProducts.map((p) => p.product_id));
  const filteredComparisons = D.comparison.filter(
    (c) =>
      filteredProductIds.has(c.current_product_id) ||
      filteredProductIds.has(c.alternative_product_id)
  );
  const compIds = new Set(filteredComparisons.map((c) => c.comparison_id));
  const filteredExperiments = D.experiment.filter((e) => compIds.has(e.comparison_id));

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    filteredProducts.forEach((p) => {
      m[p.category] = (m[p.category] ?? 0) + 1;
    });
    return Object.entries(m).map(([category, count]) => ({ category, count }));
  }, [filteredProducts]);

  const judgementCounts = useMemo(() => {
    const m: Record<string, number> = {};
    filteredExperiments.forEach((e) => {
      const k = e.judgement ?? "미정";
      m[k] = (m[k] ?? 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [filteredExperiments]);

  const priceScatter = filteredProducts
    .filter((p) => p.unit_price_krw && p.price_per_test_krw)
    .map((p) => ({
      x: p.unit_price_krw!,
      y: p.price_per_test_krw!,
      name: p.product_name,
      category: p.category,
    }));

  const selectedProduct = selectedProductId ? productMap[selectedProductId] : null;
  const selectedSpec = selectedProductId ? D.spec.find((s) => s.product_id === selectedProductId) : null;
  const productComparisons = selectedProductId
    ? D.comparison.filter(
        (c) =>
          c.current_product_id === selectedProductId ||
          c.alternative_product_id === selectedProductId,
      )
    : [];
  const productExperiments = D.experiment.filter((e) =>
    productComparisons.some((c) => c.comparison_id === e.comparison_id),
  );

  // Catalog: search + sort + paginate
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = filteredProducts;
    if (q) {
      list = list.filter((p) =>
        [p.product_name, p.cat_no, p.category, p.applied_panel, vendorMap[p.vendor_id]?.vendor_name_kr, vendorMap[p.vendor_id]?.vendor_name_en]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q)),
      );
    }
    const sorted = [...list];
    if (sortBy === "name") sorted.sort((a, b) => a.product_name.localeCompare(b.product_name));
    if (sortBy === "price") sorted.sort((a, b) => (a.unit_price_krw ?? 0) - (b.unit_price_krw ?? 0));
    if (sortBy === "category") sorted.sort((a, b) => a.category.localeCompare(b.category));
    return sorted;
  }, [filteredProducts, search, sortBy, vendorMap]);

  const totalPages = Math.max(1, Math.ceil(searched.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = searched.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FlaskConical className="text-primary" />
              원재료 DB 대시보드
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Vendor · Product · Spec · Comparison · Experiment 통합 조회
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/polysome">Polysome Viewer →</Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6 flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">공급사</label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  {D.vendor.map((v) => (
                    <SelectItem key={v.vendor_id} value={v.vendor_id}>
                      {v.vendor_name_kr} ({v.vendor_name_en})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">카테고리</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  {Array.from(new Set(D.product.map((p) => p.category))).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-auto flex gap-2 text-sm text-muted-foreground">
              필터링된 결과: <Badge variant="secondary">{filteredProducts.length} 제품</Badge>
              <Badge variant="secondary">{filteredExperiments.length} 실험</Badge>
            </div>
          </CardContent>
        </Card>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={<Building2 />} label="공급사" value={new Set(filteredProducts.map((p) => p.vendor_id)).size} />
          <KpiCard icon={<Package />} label="제품" value={filteredProducts.length} />
          <KpiCard icon={<ClipboardCheck />} label="비교 평가" value={filteredComparisons.length} />
          <KpiCard icon={<FlaskConical />} label="실험 metric" value={filteredExperiments.length} />
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="explorer">Data Explorer</TabsTrigger>
            <TabsTrigger value="raw">Raw Tables</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">카테고리별 제품 수</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={categoryCounts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" />
                      <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">실험 판정 분포</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={judgementCounts} dataKey="value" nameKey="name" outerRadius={90} label>
                        {judgementCounts.map((_, i) => (
                          <Cell key={i} fill={TEAL[i % TEAL.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">제품 단가 분포 (단가 vs 테스트당 단가)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="x" name="단가(KRW)" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="y" name="테스트당(KRW)" stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      formatter={(v: number) => v.toLocaleString()}
                      labelFormatter={() => ""}
                      content={({ payload }) => {
                        const p = payload?.[0]?.payload as typeof priceScatter[number] | undefined;
                        if (!p) return null;
                        return (
                          <div className="bg-card border rounded-md p-2 text-xs shadow">
                            <div className="font-medium">{p.name}</div>
                            <div>단가: {p.x.toLocaleString()} 원</div>
                            <div>테스트당: {p.y.toLocaleString()} 원</div>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={priceScatter} fill="hsl(var(--primary))" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* EXPLORER - Catalog style */}
          <TabsContent value="explorer" className="space-y-4">
            <Card>
              <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="제품명, Cat. No., 공급사, 카테고리 검색..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">정렬</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">제품명순</SelectItem>
                      <SelectItem value="category">카테고리순</SelectItem>
                      <SelectItem value="price">단가 낮은순</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  총 <span className="font-semibold text-foreground">{searched.length}</span>개 제품
                </div>
              </CardContent>
            </Card>

            {/* Product grid */}
            {pageItems.length === 0 ? (
              <Card><CardContent className="pt-6 text-center text-muted-foreground">검색 결과가 없습니다.</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pageItems.map((p) => {
                  const expCount = D.experiment.filter((e) =>
                    D.comparison.some(
                      (c) =>
                        (c.current_product_id === p.product_id || c.alternative_product_id === p.product_id) &&
                        c.comparison_id === e.comparison_id,
                    ),
                  ).length;
                  return (
                    <button
                      key={p.product_id}
                      onClick={() => setSelectedProductId(p.product_id)}
                      className="text-left group"
                    >
                      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 group-focus:ring-2 group-focus:ring-primary">
                        <CardContent className="pt-5 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                            {p.current_or_candidate && (
                              <Badge variant="outline" className="text-xs">{p.current_or_candidate}</Badge>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary">
                              {p.product_name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {vendorMap[p.vendor_id]?.vendor_name_kr ?? "-"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span className="font-mono">{p.cat_no ?? "—"}</span>
                            <span>
                              {p.unit_price_krw
                                ? `${p.unit_price_krw.toLocaleString()}원`
                                : "—"}
                            </span>
                          </div>
                          {expCount > 0 && (
                            <div className="text-xs text-primary">실험 {expCount}건</div>
                          )}
                        </CardContent>
                      </Card>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4" /> 이전
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  {currentPage} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
                  다음 <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Detail Sheet */}
            <Sheet open={!!selectedProductId} onOpenChange={(o) => !o && setSelectedProductId(null)}>
              <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                {selectedProduct && (
                  <>
                    <SheetHeader>
                      <SheetTitle>{selectedProduct.product_name}</SheetTitle>
                      <SheetDescription>
                        {vendorMap[selectedProduct.vendor_id]?.vendor_name_kr} · {selectedProduct.category}
                      </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-5">
                      <section>
                        <h4 className="text-sm font-semibold mb-3 text-foreground">제품 기본 정보</h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <Info label="Product ID" value={selectedProduct.product_id} />
                          <Info label="Cat. No." value={selectedProduct.cat_no} />
                          <Info label="적용 패널" value={selectedProduct.applied_panel} />
                          <Info label="패키지" value={`${selectedProduct.package_qty ?? "-"} ${selectedProduct.unit ?? ""}`} />
                          <Info label="단가" value={selectedProduct.unit_price_krw ? selectedProduct.unit_price_krw.toLocaleString() + " 원" : "-"} />
                          <Info label="테스트당 단가" value={selectedProduct.price_per_test_krw ? Math.round(selectedProduct.price_per_test_krw).toLocaleString() + " 원" : "-"} />
                          <Info label="RUO/IVD" value={selectedProduct.RUO_IVD} />
                          <Info label="기존/후보" value={selectedProduct.current_or_candidate} />
                          <Info label="비고" value={selectedProduct.note} />
                        </div>
                      </section>

                      <section>
                        <h4 className="text-sm font-semibold mb-3 text-foreground">제품 스펙</h4>
                        {selectedSpec ? (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {Object.entries(selectedSpec).map(([k, v]) => (
                              <Info key={k} label={k} value={v as string} />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">등록된 스펙이 없습니다.</p>
                        )}
                      </section>

                      <section>
                        <h4 className="text-sm font-semibold mb-3 text-foreground">실험 이력</h4>
                        {productExperiments.length === 0 ? (
                          <p className="text-sm text-muted-foreground">관련 실험이 없습니다.</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead>기존</TableHead>
                                <TableHead>대안</TableHead>
                                <TableHead>판정</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {productExperiments.map((e) => (
                                <TableRow key={e.experiment_id}>
                                  <TableCell className="text-xs">
                                    <div>{e.metric_name}</div>
                                    <div className="text-muted-foreground">{e.metric_group}</div>
                                  </TableCell>
                                  <TableCell>{e.current_value ?? "-"}</TableCell>
                                  <TableCell>{e.alternative_value ?? "-"} {e.unit ?? ""}</TableCell>
                                  <TableCell><JudgementBadge value={e.judgement} /></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </section>
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>
          </TabsContent>

          {/* RAW */}
          <TabsContent value="raw" className="space-y-4">
            <RawTable title="01_Vendor" rows={D.vendor} />
            <RawTable title="02_Product" rows={filteredProducts} />
            <RawTable title="03_Product_Spec" rows={D.spec} />
            <RawTable title="04_Comparison" rows={filteredComparisons} />
            <RawTable title="05_Experiment_Result" rows={filteredExperiments} />
            <RawTable title="06_Attachment" rows={D.attachment} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground break-words">{value ?? "-"}</div>
    </div>
  );
}

function JudgementBadge({ value }: { value: string | null }) {
  if (!value) return <Badge variant="outline">미정</Badge>;
  const v = value.toLowerCase();
  if (v.includes("가능") || v.includes("pass") || v.includes("ok"))
    return <Badge className="bg-primary text-primary-foreground">{value}</Badge>;
  if (v.includes("review")) return <Badge variant="secondary">{value}</Badge>;
  return <Badge variant="outline">{value}</Badge>;
}

function RawTable({ title, rows }: { title: string; rows: readonly unknown[] }) {
  const data = rows as Record<string, unknown>[];
  if (!data.length) return null;
  const cols = Object.keys(data[0]);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {cols.map((c) => <TableHead key={c}>{c}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i}>
                {cols.map((c) => (
                  <TableCell key={c} className="text-xs whitespace-nowrap">
                    {r[c] === null || r[c] === undefined ? "-" : String(r[c])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

