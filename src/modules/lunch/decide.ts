import { LunchOption, LunchRecord, WeightedOption } from './types';

/**
 * Lunch decision criteria
 *
 * x n days since last time the option was chosen (successfully)
 * x n/4 days since last time the category was chosen
 * x 1/n total times chosen
 */
export const decide = (
    options: LunchOption[],
    history: LunchRecord[]
): WeightedOption => {
    const weightedOptions = options.map(option => ({
        ...option,
        weight: weight(option, history),
    }));

    return select(weightedOptions);
};

const sortDate = ({ date: dateA }, { date: dateB }) =>
    new Date(dateA) > new Date(dateB) ? -1 : 1;

const days = (diff: number) => diff / (1000 * 60 * 60 * 24);

export const weight = (target: LunchOption, history: LunchRecord[]): number => {
    const visits = history
        .filter(({ option }) => option.name === target.name)
        .sort(sortDate);

    console.log(visits);

    const now = new Date().getTime();

    const daysSinceLastVisit =
        days(now - new Date((visits[0] || {}).date).getTime()) ||
        20 * Math.random();

    const categoryVisits = history
        .filter(({ option }) => option.category === target.category)
        .sort(sortDate);

    const daysSinceLastCategory =
        days(now - new Date((categoryVisits[0] || {}).date).getTime()) ||
        20 * Math.random();

    return daysSinceLastVisit + daysSinceLastCategory / 4;
};

const select = (options: (WeightedOption)[]): WeightedOption => {
    const totalWeight = options.reduce(
        (total, option) => total + option.weight,
        0
    );

    let pickPoint = Math.random() * totalWeight;

    return options.reduce((selected, option) => {
        pickPoint -= option.weight;
        if (pickPoint <= 0) {
            pickPoint = 9999999999;
            return {
                ...option,
                weight: Number(
                    ((option.weight / totalWeight) * 100).toFixed(2)
                ),
            };
        }
        return selected;
    }, null);
};
