module.exports = function(value) {
    var parts = value.split(" ");
    var allFloat = true;

    parts.forEach(function(v) {
        if (isNaN(filterFloat(v))) allFloat = false;
    });

    if (parts.length === 4 && allFloat && parts[0] >= -90 && parts[0] <= 90 && parts[1] >= -180 && parts[1] <= 180) {
        return {
            coordinates: [ parts[1], parts[0] ],
            altitude: parts[2],
            precision: parts[3]
        };
    } else {
        return value;
    }
};

// Stricter parsing function, from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/parseFloat
var filterFloat = function(value) {
    if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
        .test(value))
        return Number(value);
    return NaN;
};
