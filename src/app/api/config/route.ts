import { NextRequest, NextResponse } from "next/server";
import { globalConfig } from "@/lib/config/global-config";
import { withRateLimit } from "@/lib/api-middleware";

const handler = async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("city");
  const countryCode = searchParams.get("country");
  const type = searchParams.get("type") || "full";

  if (cityId) {
    if (type === "launch") {
      const config = globalConfig.getLaunchConfig(cityId);
      return NextResponse.json({ success: true, data: config });
    }
    const city = globalConfig.getCity(cityId);
    if (!city) return NextResponse.json({ success: false, error: "City not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: { country: city.country, city: city.city } });
  }

  if (countryCode) {
    const country = globalConfig.getCountry(countryCode);
    if (!country) return NextResponse.json({ success: false, error: "Country not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: country });
  }

  const cities = globalConfig.getActiveCities().map(({ country, city }) => ({
    id: city.id, name: city.name, namePt: city.namePt || city.name,
    countryCode: country.code, countryName: country.namePt,
    flag: country.flag, timezone: city.timezone,
    currency: city.currency, currencySymbol: city.currencySymbol,
    locale: city.locale, language: city.language,
    phoneCode: city.phoneCode,
  }));

  return NextResponse.json({ success: true, data: { countries: globalConfig.getActiveCountries(), cities } });
};

export const GET = withRateLimit(handler, 'default');
