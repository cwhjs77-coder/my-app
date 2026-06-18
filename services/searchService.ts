// ============================================================
// 통합 검색 서비스 — 자원, 기관, 인재 전체를 키워드로 검색
// ============================================================

import { getDocs, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SearchResult {
  id: string;
  type: "organization" | "human_resource" | "physical_resource" | "idea" | "talent" | "notice";
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
}

/**
 * 키워드로 모든 컬렉션을 클라이언트 사이드에서 검색합니다.
 * 실서비스에서는 Algolia, Elasticsearch 등 전문 검색 엔진을 권장합니다.
 */
export async function globalSearch(keyword: string): Promise<SearchResult[]> {
  if (!keyword.trim()) return [];

  const lowerKeyword = keyword.toLowerCase();
  const results: SearchResult[] = [];

  // 검색 대상 컬렉션 목록
  const searchTargets: Array<{
    collectionName: string;
    type: SearchResult["type"];
    titleField: string;
    subtitleField?: string;
    descField?: string;
    href: (id: string) => string;
  }> = [
    {
      collectionName: "organizations",
      type: "organization",
      titleField: "name",
      subtitleField: "type",
      descField: "description",
      href: (id) => `/dashboard/organizations?id=${id}`,
    },
    {
      collectionName: "human_resources",
      type: "human_resource",
      titleField: "name",
      subtitleField: "organizationName",
      descField: "position",
      href: (id) => `/dashboard/human-resources?id=${id}`,
    },
    {
      collectionName: "physical_resources",
      type: "physical_resource",
      titleField: "name",
      subtitleField: "organizationName",
      descField: "description",
      href: (id) => `/dashboard/physical-resources?id=${id}`,
    },
    {
      collectionName: "ideas",
      type: "idea",
      titleField: "title",
      subtitleField: "authorName",
      descField: "content",
      href: (id) => `/dashboard/ideas?id=${id}`,
    },
    {
      collectionName: "talent",
      type: "talent",
      titleField: "title",
      subtitleField: "organizationName",
      descField: "content",
      href: (id) => `/dashboard/talent?id=${id}`,
    },
    {
      collectionName: "notices",
      type: "notice",
      titleField: "title",
      subtitleField: "category",
      descField: "",
      href: (id) => `/dashboard/notices?id=${id}`,
    },
  ];

  // 각 컬렉션에서 전체 문서를 가져와 클라이언트 필터링
  const fetchPromises = searchTargets.map(async (target) => {
    try {
      const snapshot = await getDocs(collection(db, target.collectionName));
      snapshot.docs.forEach((d) => {
        const data = d.data();
        const title: string = data[target.titleField] || "";
        const subtitle: string = data[target.subtitleField || ""] || "";
        const desc: string = data[target.descField || ""] || "";

        // 키워드가 제목, 부제목, 설명, 태그 중 하나라도 포함되면 결과에 추가
        const searchable = [
          title,
          subtitle,
          desc,
          ...(data.tags || []),
          ...(data.expertise || []),
          ...(data.skills || []),
          ...(data.noticeTags || []),
        ]
          .join(" ")
          .toLowerCase();

        if (searchable.includes(lowerKeyword)) {
          results.push({
            id: d.id,
            type: target.type,
            title,
            subtitle,
            description: desc,
            href: target.href(d.id),
          });
        }
      });
    } catch (err) {
      console.warn(`[searchService] ${target.collectionName} 검색 오류:`, err);
    }
  });

  await Promise.all(fetchPromises);

  return results;
}
