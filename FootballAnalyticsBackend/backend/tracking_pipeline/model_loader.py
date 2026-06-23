from ultralytics import YOLO


def load_tracking_model(weights_path):
    return YOLO(str(weights_path))


def load_keypoint_model(weights_path):
    return YOLO(str(weights_path))