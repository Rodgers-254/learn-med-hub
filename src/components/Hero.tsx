import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, BookOpen, Award } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <div className="container px-4 py-20 lg:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="text-sm font-medium">
                  <Award className="h-3 w-3 mr-1" />
                  Trusted by 23+ Medical Professionals
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground">
                  Master Medicine with
                  <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Expert Digital Resources
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Access comprehensive medical books, detailed procedure videos, and continuous learning resources from Dr. Ogindo, MD - Gynecologist & Obstetrician.
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">2+ Medical Books</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">23+ Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-warning fill-warning" />
                  <span className="text-sm font-medium">4.9/5 Rating</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" variant="premium" className="shadow-lg hover:shadow-xl">
                  Start Learning Today
                </Button>
                <Button size="xl" variant="medical">
                  Browse Free Content
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-3">Trusted by professionals at:</p>
                <div className="flex items-center gap-6 opacity-60">
                  <span className="text-sm font-medium">Margrett Kenyatta Hospital</span>
                  <span className="text-sm font-medium">St. Mary's Hospital</span>
                  <span className="text-sm font-medium">University Of Nairobi Medicine</span>
                </div>
              </div>
            </div>

            {/* Doctor Image Placeholder */}
            <div className="relative">
              <div className="relative h-[600px] w-full rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="bg-card/95 backdrop-blur-sm rounded-xl p-6 border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary-foreground">DO</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Dr. Ogindo, MD</h3>
                        <p className="text-muted-foreground">Gynecologist & Obstetrician</p>
                        <p className="text-sm text-muted-foreground">Margaret Kenyatta Hospital, University of Nairobi</p>
                        <p className="text-sm text-muted-foreground">20+ years experience</p>
                         <p className="text-sm text-muted-foreground">Clinic at first floor Gatehouse, Nakuru , Kenya</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;