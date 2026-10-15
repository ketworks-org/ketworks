# Neural quantum states

A neural quantum state (NQS) represents the amplitudes of a many-body wavefunction using a neural network. In an orthonormal configuration basis,

$$
|\Psi_\theta\rangle = \sum_{\boldsymbol{\sigma}} \Psi_\theta(\boldsymbol{\sigma}) |\boldsymbol{\sigma}\rangle.
$$

The configuration $\boldsymbol{\sigma}$ may describe spins, occupation numbers, or another discrete basis. For particles in continuous space, the input consists of particle coordinates. The trainable parameters are denoted by $\theta$.

## Amplitude and phase

A useful decomposition is

$$
\Psi_\theta(\boldsymbol{\sigma}) = \exp\!\left[A_\theta(\boldsymbol{\sigma}) + i\phi_\theta(\boldsymbol{\sigma})\right].
$$

Here $A_\theta$ is the log magnitude and $\phi_\theta$ is the phase. Choosing a real, positive representation restricts the states that can be represented in the chosen basis. Sign and phase structure are therefore part of the ansatz design.

## Architecture and physical structure

Restricted Boltzmann machines, convolutional networks, autoregressive models, and transformers provide different representations. Symmetries can be imposed directly or implemented through a projection. In a fermionic wavefunction, exchanging identical particles must produce the appropriate antisymmetry; determinants and neural backflow are common ingredients.

The network defines a family of states. Sampling and optimization determine how that family is explored. A more expressive architecture does not, by itself, guarantee a lower measured energy.

## Next steps

- [Estimate the energy with variational Monte Carlo](../variational-monte-carlo/).
- [Start from the restricted Boltzmann machine](../restricted-boltzmann-machine/).
- [Optimize the variational parameters](../optimization/).

## References

- G. Carleo and M. Troyer, [Solving the quantum many-body problem with artificial neural networks](https://arxiv.org/abs/1606.02318).
- [NetKet documentation](https://netket.readthedocs.io/en/latest/).
