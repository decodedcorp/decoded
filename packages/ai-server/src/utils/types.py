from dataclasses import dataclass
from math import pi


@dataclass
class Radian:
    value: float

    def __post_init__(self):
        # Normalize to -2π to 2π
        self.value = self.value % (2 * pi)
        if self.value > pi:
            self.value -= 2 * pi

    @property
    def rad(self) -> float:
        return self.value


@dataclass
class Degree:
    value: float

    def __post_init__(self):
        # Normalize to -360 to 360
        self.value = self.value % 360
        if self.value > 180:
            self.value -= 360

    @property
    def deg(self) -> float:
        return self.value

    def to_radian(self) -> Radian:
        return Radian(self.value * pi / 180.0)


# Constants
PI = pi
HALF_PI = PI / 2
TWO_PI = PI * 2
