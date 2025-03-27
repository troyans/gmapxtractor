import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PricingPage = () => {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for trying out our service",
      features: [
        "10 searches per month",
        "Basic data export",
        "Standard support",
        "1 user"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline"
    },
    {
      name: "Pro",
      price: "$29",
      description: "Best for professionals and small businesses",
      features: [
        "100 searches per month",
        "Advanced data export",
        "Priority support",
        "5 team members",
        "API access",
        "Custom data fields"
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "default",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with custom needs",
      features: [
        "Unlimited searches",
        "Full API access",
        "24/7 priority support",
        "Unlimited team members",
        "Custom integration",
        "Dedicated account manager"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "secondary"
    }
  ];

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Choose the plan that's right for you. All plans include a 14-day free trial.
          </p>
        </div>
        <div className="isolate mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 sm:mt-20 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`relative p-8 ${tier.popular ? 'ring-2 ring-blue-600' : ''}`}>
              {tier.popular && (
                <div className="absolute -top-3 right-10">
                  <div className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                </div>
              )}
              <div className="flex flex-col h-full">
                <div>
                  <h3 className="text-lg font-semibold leading-8 text-gray-900">
                    {tier.name}
                  </h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-gray-900">
                      {tier.price}
                    </span>
                    {tier.price !== "Custom" && (
                      <span className="text-sm font-semibold leading-6 text-gray-600">
                        /month
                      </span>
                    )}
                  </div>
                  <p className="mt-6 text-sm leading-6 text-gray-600">
                    {tier.description}
                  </p>
                </div>
                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600 flex-grow">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <svg
                        className="h-6 w-5 flex-none text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.buttonVariant as any}
                  className="mt-8"
                  size="lg"
                >
                  {tier.buttonText}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage; 