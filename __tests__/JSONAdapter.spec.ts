import { JSONAdapter, MantleErrorTypes } from "../lib";
import { TestModel, MultiKeypathModel, URLModel, SubstitutingTestModel, ChocolateClassClusterModel, StrawberryClassClusterModel, RecursiveGroupModel } from "./TestModel";

describe("JSONAdapter", () => {
    it("should initialize nested key paths from JSON", () => {
        const values = {
            "username": null,
            "count": "5",
        };

        let model: TestModel;
        let error: Error | undefined;

        try {
            model = JSONAdapter.modelFromObject<TestModel>(values, TestModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeDefined();
        expect(error).not.toBeDefined();

        expect(model.name).toBeNull();
        expect(model.count).toEqual(5);

        const expected = {
            "username": null,
            "count": "5",
            "nested": {
                "name": null
            }
        }

        expect(JSONAdapter.objectFromModel(model)).toEqual(expected);
    });

    it("should initialize nested key paths from JSON", () => {
        const values = {
            "username": "foo",
            "nested": {
                "name": "bar"
            },
            "count": "0"
        };

        let model: TestModel;
        let error: Error | undefined;

        try {
            model = JSONAdapter.modelFromObject<TestModel>(values, TestModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeDefined();
        expect(error).not.toBeDefined();

        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toEqual("bar");

        expect(JSONAdapter.objectFromModel(model)).toEqual(values);
    });

    it("it should initialize properties with multiple key paths from JSON", () => {
        const values = {
            "latitude": 20,
            "longitude": 12,
            "nested": {
                "latitude": 12,
                "longitude": 34
            }
        };

        let model: MultiKeypathModel;
        let error: Error | undefined;

        try {
            model = JSONAdapter.modelFromObject<MultiKeypathModel>(values, MultiKeypathModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeDefined();
        expect(error).not.toBeDefined();

        expect(model.location.latitude).toEqual(20);
        expect(model.location.longitude).toEqual(12);

        expect(model.nestedLocation.latitude).toEqual(12);
        expect(model.nestedLocation.longitude).toEqual(34);

        expect(JSONAdapter.objectFromModel(model)).toEqual(values);
    });


    it("should initialize without returning any error when using a JSON with null as value", () => {
        const values = {
            "username": "foo",
            "nested": null,
            "count": "0",
        };

        let model: TestModel;
        let error: Error | undefined;

        try {
            model = JSONAdapter.modelFromObject<TestModel>(values, TestModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeDefined();
        expect(error).not.toBeDefined();

        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toBeNull();
    });

    it("should ignore unrecognized JSON keys", () => {
        const values = {
            "foobar": "foo",
            "count": "2",
            "_": null,
            "username": "buzz",
            "nested": {
                "name": "bar",
                "stuffToIgnore": 5,
                "moreNonsense": null,
            },
        };

        let model: TestModel;
        let error: Error | undefined;

        try {
            model = JSONAdapter.modelFromObject<TestModel>(values, TestModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeDefined();
        expect(error).not.toBeDefined();

        expect(model.name).toEqual("buzz");
        expect(model.count).toEqual(2);
        expect(model.nestedName).toEqual("bar");
    });


    it("should fail to initialize if JSON transformer fails", () => {
        const values = {
            "url": 666,
        };

        let model: URLModel;
        let error: Error | undefined;

        try {
            model = JSONAdapter.modelFromObject<URLModel>(values, URLModel);
        } catch (err) {
            error = err;
        }

        expect(model).not.toBeDefined();
        expect(error).toBeDefined();
    });

    it("should fail to serialize if a JSON transformer errors", () => {
        const model = new URLModel();

        (model.url as any) = "totallyNotAnNSURL";

        let object: any;
        let error: Error | undefined;

        try {
            object = JSONAdapter.objectFromModel(model);
        } catch (err) {
            error = err;
        }

        expect(object).not.toBeDefined();
        expect(error).toBeDefined();
    });

    it("should parse a different model class", () => {
        const values = {
            "username": "foo",
            "nested": {
                "name": "bar",
            },
            "count": "0",
        };

        let model: TestModel;
        let error: Error | undefined;

        try {
            model = JSONAdapter.modelFromObject<TestModel>(values, SubstitutingTestModel);
        } catch (err) {
            error = err;
        }

        expect(model).toBeInstanceOf(TestModel);
        expect(error).not.toBeDefined();

        expect(model.name).toEqual("foo");
        expect(model.count).toEqual(0);
        expect(model.nestedName).toEqual("bar");

        expect(JSONAdapter.objectFromModel(model)).toEqual(values);
    });

    it("should serialize different model classes", () => {
        const chocolate = new ChocolateClassClusterModel();
        chocolate.bitterness = 100;

        let chocolateValues: any;
        let error: Error | undefined;

        try {
            chocolateValues = JSONAdapter.objectFromModel(chocolate);
        } catch (err) {
            error = err;
        }

        expect(error).toBeUndefined();
        expect(chocolateValues).toEqual({
            "flavor": "chocolate",
            "chocolate_bitterness": "100",
        });

        const strawberry = new StrawberryClassClusterModel();
        strawberry.freshness = 20;

        let strawberryValues: any;

        try {
            strawberryValues = JSONAdapter.objectFromModel(strawberry);
        } catch (err) {
            error = err;
        }

        expect(error).toBeUndefined();
        expect(strawberryValues).toEqual({
            "flavor": "strawberry",
            "strawberry_freshness": 20,
        });
    });

    it("should return an error when no suitable model class is found", () => {
        let model: TestModel;
        let error: Error | undefined;

        try {
            model = JSONAdapter.modelFromObject<TestModel>({}, SubstitutingTestModel);
        } catch (err) {
            error = err;
        }

        expect(model).not.toBeDefined();
        expect(error).toBeDefined();
        expect(error.name).toEqual(MantleErrorTypes.JSONAdapterNoClassFound);
    });


});


describe("Deserializing multiple models", () => {
    const jsonModels = [
        {
            "username": "foo"
        },
        {
            "username": "bar"
        }
    ];

    it("should initialize models from an array of JSON dictionaries", () => {
        let models: TestModel[];
        let error: Error | undefined;

        try {
            models = JSONAdapter.modelsFromArray<TestModel>(jsonModels, TestModel);
        } catch (err) {
            error = err;
        }

        expect(error).not.toBeDefined();
        expect(models).toBeDefined();
        expect(models.length).toEqual(2);
        expect(models[0].name).toEqual("foo");
        expect(models[1].name).toEqual("bar");
    });
});

it("should return undefined and an error if it fails to initialize any model from an array", () => {
    const jsonModels = [
        {
            "username": "foo",
            "count": "1"
        },
        {
            "count": ["This won't parse"]
        }
    ];

    let models: SubstitutingTestModel[];
    let error: Error | undefined;

    try {
        models = JSONAdapter.modelsFromArray<SubstitutingTestModel>(jsonModels, SubstitutingTestModel);
    } catch (err) {
        error = err;
    }

    expect(error).toBeDefined();
    expect(error.name).toEqual(MantleErrorTypes.JSONAdapterNoClassFound);
    expect(models).toBeUndefined();
});

it("should return an array of dictionaries from models", () => {
    const model1 = new TestModel();
    model1.name = "foo";

    const model2 = new TestModel();
    model2.name = "bar";

    let objects: any[];
    let error: Error | undefined;

    try {
        objects = JSONAdapter.arrayFromModels([model1, model2]);
    } catch (err) {
        error = err;
    }

    expect(error).not.toBeDefined();

    expect(objects).toBeDefined();
    expect(objects.length).toEqual(2);
    expect(objects[0].username).toEqual("foo");
    expect(objects[1].username).toEqual("bar");
});

it("should support recursive models", () => {
    const values = {
        "owner_": {
            "name_": "Cameron",
            "groups_": [
                {
                    "owner_": {
                        "name_": "Jane"
                    }
                }
            ]
        },
        "users_": [
            {
                "name_": "Dimitri",
                "groups_": [
                    {
                        "owner_": {
                            "name_": "Doe",
                            "groups_": [
                                {
                                    "owner_": {
                                        "name_": "X"
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            {
                "name_": "John"
            }
        ]
    };

    let model: RecursiveGroupModel;
    let error: Error | undefined;

    try {
        model = JSONAdapter.modelFromObject<RecursiveGroupModel>(values, RecursiveGroupModel);
    } catch (err) {
        error = err;
    }

    expect(error).not.toBeDefined();
    expect(model).toBeDefined();
    expect(model.owner).toBeDefined();
    expect(model.owner.name).toEqual("Cameron");
    expect(model.owner.groups).toBeDefined();
    expect(model.owner.groups.length).toEqual(1);
    expect(model.owner.groups[0].owner).toBeDefined();
    expect(model.owner.groups[0].owner.name).toEqual("Jane");
    expect(model.users).toBeDefined();
    expect(model.users.length).toEqual(2);
    expect(model.users[0].name).toEqual("Dimitri");
    expect(model.users[0].groups).toBeDefined();
    expect(model.users[0].groups.length).toEqual(1);
    expect(model.users[0].groups[0].owner).toBeDefined();
    expect(model.users[0].groups[0].owner.name).toEqual("Doe");
    expect(model.users[0].groups[0].owner.groups).toBeDefined();
    expect(model.users[0].groups[0].owner.groups.length).toEqual(1);
    expect(model.users[0].groups[0].owner.groups[0].owner).toBeDefined();
    expect(model.users[0].groups[0].owner.groups[0].owner.name).toEqual("X");

    expect(JSONAdapter.objectFromModel(model)).toEqual(values);
});
