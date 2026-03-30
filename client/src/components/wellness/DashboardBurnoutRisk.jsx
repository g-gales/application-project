import BurnoutRiskCard from "../wellness/BurnoutRiskCard";

const DashboardBurnoutRisk = ({ burnoutRisk, previousBurnoutScore }) => {
  return (
    <BurnoutRiskCard
      burnoutRisk={burnoutRisk}
      previousScore={previousBurnoutScore}
      variant="dashboard"
      detailsPath="/wellness"
    />
  );
};

export default DashboardBurnoutRisk;
