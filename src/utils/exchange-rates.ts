import bitcoinUnits from 'bitcoin-units';
export const supportedExchangeTickers = ['USD', 'EUR', 'JPY', 'GBP'];

export type IExchangeRatesResponse = {
	[key: string]: number;
};

export const fetchBitfinexRates = async(): Promise<IExchangeRatesResponse> => {
	const rates: IExchangeRatesResponse = {};

	const response = await fetch('https://blocktank.synonym.to/api/v1/rate');

	const jsonResponse = (await response.json()) as string[][];
	jsonResponse.forEach((a) => {
		rates[a[0].replace('tBTC', '')] = Math.round(Number(a[1]) * 100) / 100;
	});

	return rates;
};

export type TBitcoinUnit = 'satoshi' | 'BTC' | 'mBTC' | 'μBTC';

export type IDisplayValues = {
	fiatFormatted: string;
	fiatWhole: string; // Value before decimal point
	fiatDecimal: string; // Decimal point "." or ","
	fiatDecimalValue: string; // Value after decimal point
	fiatSymbol: string; // $,€,£
	fiatTicker: string; // USD, EUR
	bitcoinFormatted: string;
	bitcoinSymbol: string; // ₿, m₿, μ₿, ⚡,
	bitcoinTicker: string; // BTC, mBTC, μBTC, Sats
	altBitcoinFormatted: string;
	altBitcoinSymbol: string; // ₿, m₿, μ₿, ⚡,
	altBitcoinTicker: string; // BTC, mBTC, μBTC, Sats
	satoshis: number;
};

export const defaultDisplayValues: IDisplayValues = {
	fiatFormatted: '-',
	fiatWhole: '',
	fiatDecimal: '',
	fiatDecimalValue: '',
	fiatSymbol: '',
	fiatTicker: '',
	bitcoinFormatted: '-',
	bitcoinSymbol: '',
	bitcoinTicker: '',
	altBitcoinFormatted: '-',
	altBitcoinSymbol: '',
	altBitcoinTicker: '',
	satoshis: 0
};

export const getDisplayValues = ({
	satoshis,
	exchangeRate,
	currency,
	bitcoinUnit,
	locale = 'en-US'
}: {
	satoshis: number;
	exchangeRate?: number;
	currency: string;
	bitcoinUnit: TBitcoinUnit;
	locale?: string;
}): IDisplayValues => {
	try {
		bitcoinUnits.setFiat(currency, exchangeRate);
		const fiatValue = exchangeRate
			? bitcoinUnits(satoshis, 'satoshi').to(currency).value().toFixed(2)
			: '-';

		let {
			fiatFormatted,
			fiatWhole,
			fiatDecimal,
			fiatDecimalValue,
			fiatSymbol,
			altBitcoinFormatted
		} = defaultDisplayValues;

		if (!isNaN(fiatValue)) {
			const fiatFormattedIntl = new Intl.NumberFormat(locale, {
				style: 'currency',
				currency
			});
			fiatFormatted = fiatFormattedIntl.format(fiatValue);

			fiatFormattedIntl.formatToParts(fiatValue).forEach((part) => {
				if (part.type === 'currency') {
					fiatSymbol = part.value;
				} else if (part.type === 'integer' || part.type === 'group') {
					fiatWhole = `${fiatWhole}${part.value}`;
				} else if (part.type === 'fraction') {
					fiatDecimalValue = part.value;
				} else if (part.type === 'decimal') {
					fiatDecimal = part.value;
				}
			});

			fiatFormatted = isNaN(fiatValue) ? '-' : fiatFormatted.replace(fiatSymbol, '');
		}

		const bitcoinFormatted = bitcoinUnits(satoshis, 'satoshi')
			.to(bitcoinUnit)
			.value()
			.toFixed(bitcoinUnit === 'satoshi' ? 0 : 8)
			.toString();

		let { bitcoinSymbol, altBitcoinSymbol } = defaultDisplayValues;
		let bitcoinTicker = bitcoinUnit.toString();
		let altBitcoinTicker: TBitcoinUnit = 'BTC';
		switch (bitcoinUnit) {
			case 'BTC':
				bitcoinSymbol = '₿';

				// Bitcoin's alt format is sats
				altBitcoinSymbol = 'Sats';
				altBitcoinTicker = 'satoshi';
				altBitcoinFormatted = `${satoshis}`; // TODO format number
				break;
			case 'mBTC':
				bitcoinSymbol = 'm₿';
				break;
			case 'μBTC':
				bitcoinSymbol = 'μ₿';
				break;
			case 'satoshi':
				bitcoinSymbol = '⚡';
				bitcoinTicker = 'Sats';

				// Sats alt format is whole bitcoins
				altBitcoinSymbol = '₿';
				altBitcoinTicker = 'BTC';
				altBitcoinFormatted = `${(satoshis / 100000000).toFixed(8)}`;
				break;
		}

		return {
			fiatFormatted,
			fiatWhole,
			fiatDecimal,
			fiatDecimalValue,
			fiatSymbol,
			fiatTicker: currency,
			bitcoinFormatted,
			bitcoinSymbol,
			bitcoinTicker,
			altBitcoinFormatted,
			altBitcoinSymbol,
			altBitcoinTicker,
			satoshis
		};
	} catch (e) {
		console.error(e);
		return defaultDisplayValues;
	}
};