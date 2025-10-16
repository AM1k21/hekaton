export interface UredniDeskaData {
    informace: Array<{
        typ: string[];
        iri: string;
        url: string;
        vyvěšení: { datum: string };
        relevantní_do: { datum: string };
        okruh: { cs: string };
        název: { cs: string };
        dokument?: Array<{
            typ: string;
            název: { cs: string };
            url: string;
        }>;
    }>;
}

export interface UserParams {
    zajmy: string[];
    lokace: string;
}

export interface ScoredInformace {
    data: UredniDeskaData['informace'][0];
    relevanceScore: number;
}

export enum ItemCategory {
    EKONOMIKA = 'Ekonomika A Trh Práce',
    INVESTICE = 'Investice Kraje',
    BEZPECNOST = 'Izs A Bezpečnost',
    DOTACE = 'Kraj A Dotace',
    KULTURA = 'Kultura A Cestovní Ruch',
    SOCIALNI = 'Lidé A Sociální Služby',
    SKOLSTVI = 'Školství A Výzkum',
    DOPRAVA = 'Veřejná Doprava A Silnice',
    ZDRAVOTNICTVI = 'Zdravotnictví A Zdraví',
    ZIVOTNI_PROSTREDI = 'Životní Prostředí',
    NEZARAZENO = 'Nezařazeno'
}

export interface CategorizedInformace {
    data: UredniDeskaData['informace'][0];
    category: ItemCategory;
}