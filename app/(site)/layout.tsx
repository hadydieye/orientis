import { AuroraBackground } from "@/components/layout/AuroraBackground";
import { Navbar } from "@/components/layout/Navbar";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AuroraBackground />
      <Navbar />
      <div className="relative flex flex-1 flex-col pt-24 sm:pt-28">
        {children}
      </div>
    </>
  );
}
