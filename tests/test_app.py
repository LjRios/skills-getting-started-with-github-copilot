from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def test_cannot_sign_up_twice_for_the_same_activity():
    email = "duplicate.student@mergington.edu"

    first_response = client.post(f"/activities/Chess Club/signup?email={email}")
    assert first_response.status_code == 200

    second_response = client.post(f"/activities/Chess Club/signup?email={email}")
    assert second_response.status_code == 409

    activities = client.get("/activities").json()
    assert activities["Chess Club"]["participants"].count(email) == 1


def test_unregister_participant_from_activity():
    response = client.delete(
        "/activities/Chess Club/unregister?email=michael@mergington.edu"
    )

    assert response.status_code == 200
    assert "Unregistered michael@mergington.edu" in response.json()["message"]

    activities = client.get("/activities").json()
    assert "michael@mergington.edu" not in activities["Chess Club"]["participants"]
