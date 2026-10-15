# Variational Monte Carlo

For a trial state $|\Psi_\theta\rangle$, the variational energy is

$$
E_\theta = \frac{\langle\Psi_\theta|H|\Psi_\theta\rangle}{\langle\Psi_\theta|\Psi_\theta\rangle} \geq E_0.
$$

The inequality applies to the exact expectation value for the specified Hamiltonian. A finite-sample estimate can fluctuate below $E_0$.

## Local energy

In a discrete orthonormal basis, define the normalized sampling distribution and local energy by

$$
p_\theta(\boldsymbol{\sigma}) = \frac{|\Psi_\theta(\boldsymbol{\sigma})|^2}{\sum_{\boldsymbol{\sigma}'}|\Psi_\theta(\boldsymbol{\sigma}')|^2},
\qquad
E_{\mathrm{loc}}(\boldsymbol{\sigma}) = \sum_{\boldsymbol{\sigma}'} H_{\boldsymbol{\sigma}\boldsymbol{\sigma}'} \frac{\Psi_\theta(\boldsymbol{\sigma}')}{\Psi_\theta(\boldsymbol{\sigma})}.
$$

Then $E_\theta=\mathbb{E}_{p_\theta}[E_{\mathrm{loc}}]$. Samples may come from a Markov chain or, for suitable architectures, direct sampling. Ratios are evaluated on sampled configurations with nonzero amplitude.

## Uncertainty and variance

The physical energy variance is

$$
\operatorname{Var}_\Psi(H) = \langle H^2\rangle_\Psi - \langle H\rangle_\Psi^2.
$$

It is distinct from the statistical uncertainty of the estimated mean. For Markov-chain samples, correlations reduce the effective sample size. Report the uncertainty estimator, equilibration procedure, and sampling protocol; variation across optimization steps is not automatically a standard error for a fixed state.

## Reporting a result

Evaluate the final state with a clearly described measurement protocol. Report the energy, its normalization, and the uncertainty with its meaning. Ketboard accepts directly evaluated NQS variational energies; zero-variance extrapolations and projected estimates are outside its scope.

See [benchmark conventions](../benchmark-conventions/) for the required physical definitions.
