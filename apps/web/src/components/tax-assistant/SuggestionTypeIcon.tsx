"use client";

import {
  Receipt,
  Calculator,
  Calendar,
  Car,
  Home,
  Laptop,
  PiggyBank,
  FileText,
  TrendingUp,
  AlertCircle,
  Briefcase,
  Heart,
  Lightbulb,
} from "lucide-react";

interface SuggestionTypeIconProps {
  type: string;
  size?: number;
  className?: string;
}

export function SuggestionTypeIcon({ type, size = 20, className = "" }: SuggestionTypeIconProps) {
  const iconProps = {
    size,
    className: `${className}`,
  };

  switch (type) {
    case "MISSED_DEDUCTION":
      return <Receipt {...iconProps} className={`${className} text-orange-500`} />;

    case "QUARTERLY_ESTIMATE":
      return <Calculator {...iconProps} className={`${className} text-blue-500`} />;

    case "DEADLINE_REMINDER":
      return <Calendar {...iconProps} className={`${className} text-red-500`} />;

    case "MILEAGE_DEDUCTION":
      return <Car {...iconProps} className={`${className} text-purple-500`} />;

    case "HOME_OFFICE_DEDUCTION":
      return <Home {...iconProps} className={`${className} text-green-500`} />;

    case "EQUIPMENT_DEDUCTION":
      return <Laptop {...iconProps} className={`${className} text-indigo-500`} />;

    case "RETIREMENT_CONTRIBUTION":
      return <PiggyBank {...iconProps} className={`${className} text-pink-500`} />;

    case "TAX_OPTIMIZATION":
      return <TrendingUp {...iconProps} className={`${className} text-emerald-500`} />;

    case "ESTIMATED_TAX_PAYMENT":
      return <FileText {...iconProps} className={`${className} text-yellow-500`} />;

    case "BUSINESS_EXPENSE":
      return <Briefcase {...iconProps} className={`${className} text-cyan-500`} />;

    case "HEALTH_INSURANCE_DEDUCTION":
      return <Heart {...iconProps} className={`${className} text-rose-500`} />;

    case "TAX_CREDIT_OPPORTUNITY":
      return <Lightbulb {...iconProps} className={`${className} text-amber-500`} />;

    default:
      return <AlertCircle {...iconProps} className={`${className} text-gray-500`} />;
  }
}
