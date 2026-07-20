handler: async (request, context) => {
    context.log("CreateLoan endpoint called");

    return {
        status: 200,
        jsonBody: {
            success: true,
            message: "Trail Companion API is working!"
        }
    };
}