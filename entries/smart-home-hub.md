---
title: Smart Home Hub
category: Project
tags: [iot, raspberry-pi, home-automation]
date: 2026-04-01
---

# Smart Home Hub

A centralized dashboard for controlling IoT devices at home, built on a Raspberry Pi.

## Goals

- Unified control for lights, sensors, and cameras
- Local-first — no cloud dependency
- REST API for custom integrations
- Simple web UI accessible from any device on the network

## Tech Stack

| Layer       | Technology        |
|-------------|-------------------|
| Hardware    | Raspberry Pi 4    |
| Backend     | Python / FastAPI   |
| Frontend    | HTML + Vanilla JS  |
| Protocol    | MQTT + Zigbee      |
| Database    | SQLite             |

## Status

- [x] Basic MQTT broker setup
- [x] Light toggle endpoint
- [ ] Sensor data dashboard
- [ ] Camera feed integration
- [ ] Mobile-friendly UI

## Notes

Considering adding voice control via a local speech-to-text model to avoid sending audio to the cloud.
