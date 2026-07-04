import CustomInput from "../../CustomInput";

const BusinessSettingsTab = ({ settings, updateField }) => {
  return (
    <div className="space-y-5">
      <CustomInput
        label="Business Name"
        value={settings.businessName}
        placeholder="Enter registered business name"
        onChange={(e) => updateField("businessName", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <CustomInput
          label="Business Nature"
          value={settings.businessNature}
          placeholder="e.g. Retail, Manufacturing, etc."
          onChange={(e) => updateField("businessNature", e.target.value)}
        />
        <CustomInput
          label="Business Province"
          value={settings.businessProvince}
          placeholder="e.g. Punjab, Sindh, etc."
          onChange={(e) => updateField("businessProvince", e.target.value)}
        />
      </div>
      <CustomInput
        label="FBR Token"
        value={settings.fbrTokenNo}
        placeholder="Enter FBR token number"
        onChange={(e) => updateField("fbrTokenNo", e.target.value)}
      />
      <CustomInput
        label="Validation Token"
        value={settings.fbrValidationTokenNo}
        placeholder="Enter validation token"
        onChange={(e) => updateField("fbrValidationTokenNo", e.target.value)}
      />
    </div>
  );
};

export default BusinessSettingsTab;
