//Turn ?page and ?limit into skip/limit and the next/prev links of the response.
//page >= 1, limit defaults to 10 and is kept between 1 and 50.
exports.getPagination = (query, total) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const pagination = {};

    if (page * limit < total) {
        pagination.next = { page: page + 1, limit };
    }

    if (skip > 0) {
        pagination.prev = { page: page - 1, limit };
    }

    return { skip, limit, pagination };
};
