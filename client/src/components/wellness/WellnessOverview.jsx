import BurnoutRiskCard from "./BurnoutRiskCard";

const WellnessOverview = ({ burnoutRisk, previousBurnoutScore }) => {
  return (
    <BurnoutRiskCard
      burnoutRisk={burnoutRisk}
      previousScore={previousBurnoutScore}
      variant="wellness"
    />
  );
};

export default WellnessOverview;
