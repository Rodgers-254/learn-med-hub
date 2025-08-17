import React from "react";
import { HeartPulse, BookOpen, GraduationCap } from "lucide-react";

const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      className="py-20 bg-gradient-to-b from-background via-background/90 to-background"
    >
      <div className="container mx-auto px-4 max-w-5xl text-center">
        <h2 className="text-3xl font-bold mb-6 text-foreground">About MedBooks</h2>
        <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
          MedBooks is your trusted source for high-quality, accessible medical
          knowledge. Designed for both professionals and students, our
          platform offers a curated library of medical books and learning resources — anytime, anywhere.
        </p>

        <div className="grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <BookOpen className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-semibold text-lg">Extensive Library</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Access a wide range of medical books and publications carefully
              selected by healthcare professionals.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <HeartPulse className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-semibold text-lg">Expert Knowledge</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Learn from verified resources and content authored by experienced
              medical practitioners.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <GraduationCap className="h-10 w-10 text-primary mb-3" />
            <h3 className="font-semibold text-lg">Learn Anywhere</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Whether you’re at home or on the go, access our resources on any
              device with ease.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
