def test_create_robot(client):
    response = client.post(
        "/robots",
        json={
            "x": 1.0,
            "y": 2.0,
            "z": 3.0,
            "dx": 0.1,
            "dy": 0.2,
            "dz": 0.3
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["x"] == 1.0
    assert data["y"] == 2.0
    assert data["z"] == 3.0
    assert "id" in data


def test_get_robots(client):
    response = client.get("/robots")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_update_robot(client):
    # create robot first
    create = client.post(
        "/robots",
        json={"x": 0, "y": 0, "z": 0}
    ).json()

    robot_id = create["id"]

    response = client.put(
        f"/robots/{robot_id}",
        json={"x": 10, "y": 20, "z": 30}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["x"] == 10
    assert data["y"] == 20
    assert data["z"] == 30


def test_delete_robots(client):
    response = client.delete("/robots")
    assert response.status_code == 200