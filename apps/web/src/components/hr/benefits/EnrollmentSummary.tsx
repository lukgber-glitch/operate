'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  Heart,
  TrendingUp,
  Shield,
  Wallet,
  Users,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { BenefitPlan, Dependent, BenefitsEnrollmentState, CoverageLevel } from '@/types/benefits';

interface EnrollmentSummaryProps {
  state: BenefitsEnrollmentState;
  plans: BenefitPlan[];
  onSubmit: () => void;
  onEdit: (step: number) => void;
  isSubmitting?: boolean;
}

export function EnrollmentSummary({
  state,
  plans,
  onSubmit,
  onEdit,
  isSubmitting = false,
}: EnrollmentSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getPlanById = (planId: string | null): BenefitPlan | undefined => {
    if (!planId) return undefined;
    return plans.find((p) => p.id === planId);
  };

  const healthPlan = getPlanById(state.healthPlan);
  const dentalPlan = getPlanById(state.dentalPlan);
  const visionPlan = getPlanById(state.visionPlan);
  const retirementPlan = getPlanById(state.retirementPlan);
  const lifePlan = getPlanById(state.lifePlan);

  // Calculate total costs
  let totalMonthlyPremium = 0;
  let totalEmployerContribution = 0;

  if (healthPlan && state.healthCoverageLevel) {
    totalMonthlyPremium += healthPlan.employeeMonthlyPremium[state.healthCoverageLevel] || 0;
    totalEmployerContribution += healthPlan.employerMonthlyContribution[state.healthCoverageLevel] || 0;
  }

  if (dentalPlan && state.dentalCoverageLevel) {
    totalMonthlyPremium += dentalPlan.employeeMonthlyPremium[state.dentalCoverageLevel] || 0;
    totalEmployerContribution += dentalPlan.employerMonthlyContribution[state.dentalCoverageLevel] || 0;
  }

  if (visionPlan && state.visionCoverageLevel) {
    totalMonthlyPremium += visionPlan.employeeMonthlyPremium[state.visionCoverageLevel] || 0;
    totalEmployerContribution += visionPlan.employerMonthlyContribution[state.visionCoverageLevel] || 0;
  }

  // Assume biweekly pay frequency (26 paychecks per year)
  const costPerPaycheck = (totalMonthlyPremium * 12) / 26;
  const annualCost = totalMonthlyPremium * 12;

  const hasSelections =
    state.healthPlan ||
    state.dentalPlan ||
    state.visionPlan ||
    state.retirementPlan ||
    state.lifePlan ||
    state.hsaPlan ||
    state.fsaPlan;

  const formatCoverageLevel = (level: CoverageLevel | null) => {
    if (!level) return '';
    return level.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Enrollment Summary
          </CardTitle>
          <CardDescription>
            Review your benefit selections before submitting your enrollment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasSelections && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You haven't selected any benefits. Please go back and make your selections or choose to waive coverage.
              </AlertDescription>
            </Alert>
          )}

          {/* Health Insurance Section */}
          {(healthPlan || dentalPlan || visionPlan) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Health Insurance
                </h3>
                <Button variant="ghost" size="sm" onClick={() => onEdit(2)}>
                  Edit
                </Button>
              </div>

              {healthPlan && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{healthPlan.name}</p>
                      <p className="text-sm text-muted-foreground">{healthPlan.provider}</p>
                    </div>
                    <Badge>Medical</Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Coverage:</span>{' '}
                    <span className="font-medium">{formatCoverageLevel(state.healthCoverageLevel)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Monthly premium:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        healthPlan.employeeMonthlyPremium[state.healthCoverageLevel!] || 0
                      )}
                    </span>
                  </div>
                </div>
              )}

              {dentalPlan && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{dentalPlan.name}</p>
                      <p className="text-sm text-muted-foreground">{dentalPlan.provider}</p>
                    </div>
                    <Badge variant="secondary">Dental</Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Coverage:</span>{' '}
                    <span className="font-medium">{formatCoverageLevel(state.dentalCoverageLevel)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Monthly premium:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        dentalPlan.employeeMonthlyPremium[state.dentalCoverageLevel!] || 0
                      )}
                    </span>
                  </div>
                </div>
              )}

              {visionPlan && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{visionPlan.name}</p>
                      <p className="text-sm text-muted-foreground">{visionPlan.provider}</p>
                    </div>
                    <Badge variant="outline">Vision</Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Coverage:</span>{' '}
                    <span className="font-medium">{formatCoverageLevel(state.visionCoverageLevel)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Monthly premium:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        visionPlan.employeeMonthlyPremium[state.visionCoverageLevel!] || 0
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Retirement Section */}
          {retirementPlan && state.retirementContribution && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Retirement Savings
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(3)}>
                    Edit
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{retirementPlan.name}</p>
                    <Badge>401(k)</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contribution type:</span>
                      <span className="font-medium capitalize">
                        {state.retirementContribution.contributionType}
                      </span>
                    </div>
                    {state.retirementContribution.contributionPercentage && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contribution:</span>
                        <span className="font-medium">
                          {state.retirementContribution.contributionPercentage}%
                        </span>
                      </div>
                    )}
                    {state.retirementContribution.contributionAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per paycheck:</span>
                        <span className="font-medium">
                          {formatCurrency(state.retirementContribution.contributionAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account type:</span>
                      <span className="font-medium">
                        {state.retirementContribution.rothContribution ? 'Roth 401(k)' : 'Traditional 401(k)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Life Insurance Section */}
          {lifePlan && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Life Insurance
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(4)}>
                    Edit
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{lifePlan.name}</p>
                    <Badge>Life</Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Basic coverage:</span>
                      <span className="font-medium">1x Salary (Employer Paid)</span>
                    </div>
                    {state.supplementalLifeCoverage && state.supplementalLifeCoverage > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supplemental:</span>
                        <span className="font-medium">
                          {formatCurrency(state.supplementalLifeCoverage)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beneficiaries:</span>
                      <span className="font-medium">{state.beneficiaries.length} designated</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* HSA/FSA Section */}
          {(state.hsaPlan || state.fsaPlan) && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-500" />
                    Health Savings Account
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(5)}>
                    Edit
                  </Button>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  {state.hsaPlan && (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">Health Savings Account (HSA)</p>
                        <Badge variant="secondary">HSA</Badge>
                      </div>
                      <div className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Annual contribution:</span>
                          <span className="font-medium">{formatCurrency(state.hsaContribution || 0)}</span>
                        </div>
                      </div>
                    </>
                  )}
                  {state.fsaPlan && (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">Flexible Spending Account (FSA)</p>
                        <Badge variant="secondary">FSA</Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        {state.fsaHealthcareContribution && state.fsaHealthcareContribution > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Healthcare FSA:</span>
                            <span className="font-medium">
                              {formatCurrency(state.fsaHealthcareContribution)}
                            </span>
                          </div>
                        )}
                        {state.fsaDependentCareContribution && state.fsaDependentCareContribution > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dependent Care FSA:</span>
                            <span className="font-medium">
                              {formatCurrency(state.fsaDependentCareContribution)}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Dependents Section */}
          {state.dependents.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Covered Dependents
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(6)}>
                    Edit
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <ul className="space-y-2">
                    {state.dependents.map((dependent, index) => (
                      <li key={index} className="flex justify-between text-sm">
                        <span>
                          {dependent.firstName} {dependent.lastName}
                        </span>
                        <Badge variant="outline">{dependent.relationship}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Cost Summary */}
          <div className="space-y-4 bg-muted p-6 rounded-lg">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Cost Summary
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your monthly premium:</span>
                <span className="font-semibold">{formatCurrency(totalMonthlyPremium)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Employer contribution:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(totalEmployerContribution)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Cost per paycheck:</span>
                <span className="text-xl font-bold">{formatCurrency(costPerPaycheck)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Annual cost:</span>
                <span className="font-medium">{formatCurrency(annualCost)}</span>
              </div>
            </div>
          </div>

          {/* Enrollment Period */}
          {state.enrollmentPeriod && (
            <Alert>
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                <strong>Enrollment Period:</strong> {state.enrollmentPeriod.name}
                <br />
                <span className="text-sm">
                  Coverage effective date:{' '}
                  {new Date(state.enrollmentPeriod.startDate).toLocaleDateString()}
                </span>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => onEdit(state.currentStep - 1)}>
              Go Back
            </Button>
            <Button
              className="flex-1"
              onClick={onSubmit}
              disabled={isSubmitting || !hasSelections}
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit Enrollment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
