export interface PageSpeedScores {
  performance?: number | null;
  accessibility?: number | null;
  best_practices?: number | null;
  seo?: number | null;
}

export interface ContactInfo {
  emails?: string[];
  phones?: string[];
  social_links?: string[];
}

export interface BusinessInfo {
  business_name: string;
  location?: string;
  original_url: string;
}

export interface DesignIssue {
  description: string;
  severity: 'low' | 'medium' | 'high';
  type: 'performance' | 'accessibility' | 'seo' | 'best-practices';
}

export interface Lead {
  url: string;
  pagespeed?: PageSpeedScores;
  contact_info?: ContactInfo;
  design_issues?: DesignIssue[];
  business_info?: BusinessInfo;
}

export interface SortConfig {
  key: LeadSortKeys | null;
  direction: 'asc' | 'desc';
}

export type LeadSortKeys = keyof Lead | `pagespeed.${keyof PageSpeedScores}`;

// Type guard to validate Lead objects
export const isValidLead = (item: unknown): item is Lead => {
  if (!item || typeof item !== 'object') return false;
  
  const lead = item as Lead;
  if (typeof lead.url !== 'string') return false;

  // Validate PageSpeedScores if present
  if (lead.pagespeed) {
    const scores = ['performance', 'accessibility', 'best_practices', 'seo'];
    for (const score of scores) {
      const value = lead.pagespeed[score as keyof PageSpeedScores];
      if (value !== undefined && value !== null && typeof value !== 'number') {
        return false;
      }
    }
  }

  // Validate ContactInfo if present
  if (lead.contact_info) {
    if (lead.contact_info.emails && !Array.isArray(lead.contact_info.emails)) return false;
    if (lead.contact_info.phones && !Array.isArray(lead.contact_info.phones)) return false;
    if (lead.contact_info.social_links && !Array.isArray(lead.contact_info.social_links)) return false;
  }

  // Validate BusinessInfo if present
  if (lead.business_info) {
    if (typeof lead.business_info.business_name !== 'string') return false;
    if (lead.business_info.location && typeof lead.business_info.location !== 'string') return false;
    if (typeof lead.business_info.original_url !== 'string') return false;
  }

  // Validate design_issues if present
  if (lead.design_issues) {
    if (!Array.isArray(lead.design_issues)) return false;
    return lead.design_issues.every(issue => 
      typeof issue.description === 'string' &&
      ['low', 'medium', 'high'].includes(issue.severity) &&
      ['performance', 'accessibility', 'seo', 'best-practices'].includes(issue.type)
    );
  }

  return true;
};

// Type for filtering options
export interface FilterOptions {
  minPerformanceScore?: number;
  minAccessibilityScore?: number;
  hasContactInfo?: boolean;
  hasIssues?: boolean;
}

// Helper type for type-safe object paths
export type PathsToStringProps<T> = T extends string | number | boolean | null | undefined
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>]
    }[Extract<keyof T, string>];

// Convert a path array to a dotted string
export type PathToDottedString<T extends ReadonlyArray<string>> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? R extends ReadonlyArray<string>
      ? `${F}.${PathToDottedString<R>}`
      : never
    : never
  : string;