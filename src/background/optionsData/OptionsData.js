class OptionsData {
    constructor({ endpoints }) {
        this.endpoints = endpoints;
    }

    setCurrentEndpoint = async () => {
        await this.endpoints.getSelectedEndpoint();
    };
}

export default OptionsData;
