import { siteConfig } from "@/config/site";
import { vrinkCopy } from "@/content/vrink-copy";

import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="section-footer border-t border-[var(--border-subtle)] bg-[var(--surface-muted)]">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12">
          <section className="lg:col-span-5">
            <h2 className="text-h4">{siteConfig.name}</h2>
            <p className="mt-4 text-body-2 text-[var(--text-muted)]">
              {vrinkCopy.footer.summary}
            </p>
          </section>

          <section className="lg:col-span-4">
            <h3 className="text-lg font-semibold">회사 정보</h3>
            <ul className="mt-4 space-y-2 text-body-2 text-[var(--text-muted)]">
              <li>사업자명: {vrinkCopy.footer.companyInfo.companyName}</li>
              <li>사업자번호: {vrinkCopy.footer.companyInfo.registrationNumber}</li>
              <li>대표자: {vrinkCopy.footer.companyInfo.owner}</li>
              <li>주소: {vrinkCopy.footer.companyInfo.address}</li>
            </ul>
          </section>

          <section className="lg:col-span-3">
            <h3 className="text-lg font-semibold">Contact</h3>
            <ul className="mt-4 space-y-2 text-body-2 text-[var(--text-muted)]">
              <li>Email: {vrinkCopy.footer.contact.email}</li>
              <li>Phone: {vrinkCopy.footer.contact.phone}</li>
              <li>Instagram: {vrinkCopy.footer.contact.instagram}</li>
              <li>Website: {vrinkCopy.footer.contact.website}</li>
            </ul>
          </section>
        </div>

        <div className="mt-10 border-t border-[var(--border-subtle)] pt-6 text-caption text-[var(--text-subtle)]">
          {vrinkCopy.footer.copyright}
        </div>
      </Container>
    </footer>
  );
}
