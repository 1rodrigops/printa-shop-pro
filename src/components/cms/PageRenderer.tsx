import { useTenantContext } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PageSection {
  id: string;
  component: string;
  props: Record<string, any>;
}

interface PageContent {
  type: string;
  sections: PageSection[];
}

interface PageRendererProps {
  content: PageContent;
}

const Hero = ({ title, subtitle, cta }: any) => {
  const { branding } = useTenantContext();
  const primaryColor = branding?.primary || "#111111";
  const accentColor = branding?.accent || "#FF6A00";

  return (
    <section className="pt-32 pb-20 px-4">
      <div className="container mx-auto text-center">
        <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {title}
          </span>
        </h1>
        {subtitle && <p className="text-lg text-muted-foreground mb-8">{subtitle}</p>}
        {cta && (
          <Button
            size="lg"
            style={{ backgroundColor: primaryColor }}
            className="hover:opacity-90"
            onClick={() => (window.location.href = cta.href)}
          >
            {cta.label}
          </Button>
        )}
      </div>
    </section>
  );
};

const RichText = ({ title, html }: any) => {
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {title && <h2 className="text-3xl font-bold mb-6">{title}</h2>}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
};

const CardsGrid = ({ title, items = [] }: any) => {
  const { branding } = useTenantContext();
  const primaryColor = branding?.primary || "#111111";

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {title && <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item: any, i: number) => (
            <Card
              key={i}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => item.href && (window.location.href = item.href)}
            >
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2" style={{ color: primaryColor }}>
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureList = ({ title, items = [] }: any) => {
  const { branding } = useTenantContext();
  const accentColor = branding?.accent || "#FF6A00";

  return (
    <section className="py-12 px-4 bg-muted/50">
      <div className="container mx-auto">
        {title && <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {items.map((item: string, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <p className="text-lg">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MediaGallery = ({ title, mediaQuery }: any) => {
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        {title && <h2 className="text-3xl font-bold mb-8 text-center">{title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Galeria de Mídias</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactBlock = ({ whatsapp, email }: any) => {
  const { branding } = useTenantContext();
  const primaryColor = branding?.primary || "#111111";

  return (
    <section className="py-16 px-4 bg-muted/50">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">Fale Conosco</h2>
        <div className="flex flex-col gap-4 items-center">
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg hover:underline"
              style={{ color: primaryColor }}
            >
              WhatsApp: {whatsapp}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="text-lg hover:underline"
              style={{ color: primaryColor }}
            >
              E-mail: {email}
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

const componentMap: Record<string, React.ComponentType<any>> = {
  Hero,
  RichText,
  CardsGrid,
  FeatureList,
  MediaGallery,
  ContactBlock,
};

export const PageRenderer = ({ content }: PageRendererProps) => {
  if (!content || !content.sections) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Nenhum conteúdo disponível</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {content.sections.map((section) => {
        const Component = componentMap[section.component];

        if (!Component) {
          console.warn(`Componente não encontrado: ${section.component}`);
          return null;
        }

        return <Component key={section.id} {...section.props} />;
      })}
    </div>
  );
};
