struct Camera {
    view: mat4x4f,
}

@group(0) @binding(0)
var<uniform> camera: Camera;

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) normal: vec3f,
}

@vertex
fn vs_main(
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
) -> VertexOutput {
    var output: VertexOutput;
    output.position = camera.view * vec4f(position, 1.0);
    output.normal = normal;
    return output;
}

@fragment
fn fs_main(
    @location(0) normal: vec3f,
) -> @location(0) vec4f {
    let n = normalize(normal);
    let lightDirection = normalize(vec3f(1.0, 1.0, 1.0));
    let intensity = max(dot(n, lightDirection), 0.0);
    let baseColor = n * 0.5 + 0.5;
    return vec4f(baseColor * intensity, 1.0);
}
