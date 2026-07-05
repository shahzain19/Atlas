from setuptools import setup, find_packages

setup(
    name="atlas-sdk",
    version="1.0.0",
    description="Official Python SDK for the Atlas intelligent machine platform",
    author="Atlas Team",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[],
    extras_require={
        "dev": ["pytest", "black", "flake8"],
    },
)
