import { HARBOR_INDEX_CONTRIBUTORS } from "../harbor-index-data";
import Link from "next/link";

export const metadata = {
  title: "Harbor-Index Contributors",
};

export default function HarborIndexContributorsPage() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-6 sm:pt-12">
      <div className="flex w-full max-w-7xl flex-1 flex-col">
        <h2 className="mb-6 font-mono text-4xl tracking-tighter">
          Harbor-Index Contributors
        </h2>
        <p className="text-muted-foreground mb-12 font-mono text-base/relaxed">
          Harbor-Index was distilled and audited by a large community. See the{" "}
          <Link
            href="/blog/harbor-index"
            className="text-foreground underline underline-offset-4"
          >
            release post
          </Link>{" "}
          for how it was built, and{" "}
          <a
            href="https://discord.gg/2Pe5uWGcV3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4"
          >
            come join us
          </a>{" "}
          to contribute to future versions.
        </p>
        <div className="-mx-4 grid grid-cols-1 items-stretch sm:mx-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {HARBOR_INDEX_CONTRIBUTORS.map(({ name, role, link }) => {
            const card = (
              <div className="bg-card hover:bg-sidebar dark:hover:bg-accent -mb-px flex-1 border-y p-4 transition-all duration-200 sm:-mr-px sm:border-x">
                <p className="mb-1 font-mono text-lg">{name}</p>
                <p className="text-muted-foreground font-mono text-xs">{role}</p>
              </div>
            );
            return link ? (
              <Link
                href={link}
                key={name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col"
              >
                {card}
              </Link>
            ) : (
              <div key={name} className="flex flex-col">
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
