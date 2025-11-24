const Utils = {
    // Check collision between two rectangles
    rectIntersect: function(r1, r2) {
        return !(r2.left > r1.right || 
                 r2.right < r1.left || 
                 r2.top > r1.bottom || 
                 r2.bottom < r1.top);
    },

    // Get random integer between min and max (inclusive)
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};
