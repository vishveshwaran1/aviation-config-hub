import powerBiImg from "@/assets/powerbi.png";

const POWER_BI_URL =
  "https://app.powerbi.com/links/5dJnpe9ryG?ctid=a08e97ba-0317-429e-98e2-1e509b6745be&pbi_source=linkShare";

const PowerBi = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
        Click the image to open the PowerBI dashboard
      </p>
      <a href={POWER_BI_URL} target="_blank" rel="noreferrer">
        <img
          src={powerBiImg}
          alt="PowerBI Dashboard"
          className="max-w-full rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:scale-[1.01] transition-transform cursor-pointer"
          style={{ maxHeight: 480 }}
        />
      </a>
    </div>
  );
};

export default PowerBi;
