import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";

const SubscriptionPlans = () => {
  const plans = [
    {
      name: "Basic",
      description: "Perfect for medical students and residents",
      price: "$19",
      period: "month",
      icon: Star,
      popular: false,
      features: [
        "Access to 50+ medical books",
        "Basic video library (20+ videos)",
        "Monthly Q&A sessions",
        "Mobile app access",
        "Basic search functionality",
        "Community forum access"
      ],
      limitations: [
        "Limited to 5 downloads per month",
        "No offline access to videos"
      ]
    },
    {
      name: "Standard", 
      description: "Most popular for practicing physicians",
      price: "$39",
      period: "month",
      icon: Zap,
      popular: true,
      features: [
        "Access to 200+ medical books",
        "Complete video library (100+ videos)",
        "Weekly live sessions with Dr. Chen",
        "Priority customer support",
        "Advanced search & filtering",
        "Offline book downloads",
        "Video downloads for offline viewing",
        "Personal study progress tracking",
        "Continuing education certificates"
      ],
      limitations: []
    },
    {
      name: "Premium",
      description: "Complete access for medical professionals",
      price: "$79", 
      period: "month",
      icon: Crown,
      popular: false,
      features: [
        "Access to ALL medical books (500+)",
        "Complete video library + exclusive content",
        "1-on-1 monthly consultation with Dr. Chen",
        "Early access to new content",
        "Custom study plans",
        "Advanced analytics & reporting",
        "Team collaboration tools",
        "White-label licensing options",
        "API access for integration",
        "Priority content requests"
      ],
      limitations: []
    }
  ];

  return (
    <section id="subscriptions" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Choose Your Learning Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Flexible subscription plans designed for every stage of your medical career
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={plan.name}
                className={`relative transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular 
                    ? "border-primary shadow-lg scale-105" 
                    : "hover:shadow-md"
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                    plan.popular 
                      ? "bg-gradient-to-br from-primary to-primary-glow" 
                      : "bg-muted"
                  }`}>
                    <Icon className={`h-8 w-8 ${
                      plan.popular ? "text-primary-foreground" : "text-muted-foreground"
                    }`} />
                  </div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Limitations:</p>
                      {plan.limitations.map((limitation, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          • {limitation}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "premium" : "medical"}
                    size="lg"
                  >
                    {plan.popular ? "Start Free Trial" : "Get Started"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12 space-y-4">
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial • Cancel anytime • No hidden fees
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <span>✓ Secure payment processing</span>
            <span>✓ 30-day money-back guarantee</span>
            <span>✓ 24/7 customer support</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;