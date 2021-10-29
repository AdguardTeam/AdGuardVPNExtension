// TODO
//  - fetch services from backend
//  - handle persistence
//  - or from storage
class ExclusionsService {
    id: string;

    name: string;

    iconUrl: string;

    categories: string[];

    modifiedTime: string;

    constructor({
        id,
        name,
        iconUrl,
        categories,
        modifiedTime,
    }) {
        this.id = id;
        this.name = name;
        this.iconUrl = iconUrl;
        this.categories = categories;
        this.modifiedTime = modifiedTime;
    }
}
